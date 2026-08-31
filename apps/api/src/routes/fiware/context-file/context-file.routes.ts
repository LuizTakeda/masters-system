import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import {
  GetContextFileResponseSchema,
  UpsertContextFileBodySchema,
} from "@repo/types/endpoints/fiware/context-file";

const contextFileRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // ==========================================
  // GET (Get Global Context File)
  // ==========================================
  fastify.get(
    "",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Get Global FIWARE Context File",
        description: "Retrieves the global JSON-LD @context file and metadata.",
        security: [{ bearerAuth: [] }],
        response: {
          200: GetContextFileResponseSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const contextFile = await fastify.prisma.fiwareContextFile.findUnique({
          where: { name: "global" },
        });

        if (!contextFile) {
          return reply.notFound("No global context file found");
        }

        return {
          name: contextFile.name,
          file: contextFile.file as Record<string, any>,
          createdAt: contextFile.createdAt,
          updatedAt: contextFile.updatedAt,
        };
      } catch (error) {
        request.log.error(error, "Failed to retrieve global context file");
        return reply.internalServerError("Failed to retrieve global context file");
      }
    }
  );

  // ==========================================
  // GET /context.jsonld (Raw JSON-LD)
  // ==========================================
  fastify.get(
    "/context.jsonld",
    {
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Serve Raw Global JSON-LD Context File",
        description: "Serves the raw global JSON-LD @context file with application/ld+json content type for NGSI-LD brokers and IoT clients.",
        response: {
          200: z.record(z.string(), z.any()).describe("Raw JSON-LD @context object"),
          404: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const contextFile = await fastify.prisma.fiwareContextFile.findUnique({
          where: { name: "global" },
        });

        if (!contextFile) {
          return reply.notFound("No global context file found");
        }

        reply.header("Content-Type", "application/ld+json; charset=utf-8");
        reply.header("Last-Modified", contextFile.updatedAt.toUTCString());

        return contextFile.file;
      } catch (error) {
        request.log.error(error, "Failed to serve raw global context file");
        return reply.internalServerError("Failed to serve raw global context file");
      }
    }
  );

  // ==========================================
  // POST (Create or Update Context File)
  // ==========================================
  fastify.post(
    "",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Create or Update Global FIWARE Context File",
        description: "Upserts the global JSON-LD @context file.",
        security: [{ bearerAuth: [] }],
        body: UpsertContextFileBodySchema,
        response: {
          200: ResponseMessageSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { file } = request.body;

        await fastify.prisma.fiwareContextFile.upsert({
          where: { name: "global" },
          create: {
            name: "global",
            file,
          },
          update: {
            file,
          },
        });

        return {
          message: "Global context file updated successfully.",
        };
      } catch (error) {
        request.log.error(error, "Failed to save global context file");
        return reply.internalServerError("Failed to save global context file");
      }
    }
  );

  // ==========================================
  // DELETE (Delete Context File)
  // ==========================================
  fastify.delete(
    "",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Delete Global FIWARE Context File",
        description: "Deletes the global JSON-LD @context file.",
        security: [{ bearerAuth: [] }],
        response: {
          200: ResponseMessageSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const existing = await fastify.prisma.fiwareContextFile.findUnique({
          where: { name: "global" },
        });

        if (!existing) {
          return reply.notFound("No global context file found");
        }

        await fastify.prisma.fiwareContextFile.delete({
          where: { name: "global" },
        });

        return {
          message: "Global context file was deleted successfully.",
        };
      } catch (error) {
        request.log.error(error, "Failed to delete global context file");
        return reply.internalServerError("Failed to delete global context file");
      }
    }
  );
};

export default contextFileRoutes;