import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import {
  ContextFileProjectParamsSchema,
  GetContextFileResponseSchema,
  UpsertContextFileBodySchema,
} from "@repo/types/endpoints/fiware/context-file";

const contextFileRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // ==========================================
  // GET /:project (Get Project Context File)
  // ==========================================
  fastify.get(
    "/:project",
    {
      onRequest: [fastify.authenticateProject],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Get Project FIWARE Context File",
        description: "Retrieves the JSON-LD @context file and metadata associated with the specified project.",
        security: [{ bearerAuth: [] }],
        params: ContextFileProjectParamsSchema,
        response: {
          200: GetContextFileResponseSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { project } = request.params;

        const contextFile = await fastify.prisma.projectContextFile.findUnique({
          where: { project },
        });

        if (!contextFile) {
          return reply.notFound(`No context file found for project '${project}'`);
        }

        return {
          name: contextFile.name,
          description: contextFile.description,
          version: contextFile.version,
          file: contextFile.file as Record<string, any>,
          createdAt: contextFile.createdAt,
          updatedAt: contextFile.updatedAt,
        };
      } catch (error) {
        request.log.error(error, "Failed to retrieve project context file");
        return reply.internalServerError("Failed to retrieve project context file");
      }
    }
  );

  // ==========================================
  // GET /:project/context.jsonld (Raw JSON-LD)
  // ==========================================
  fastify.get(
    "/:project/context.jsonld",
    {
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Serve Raw JSON-LD Context File",
        description: "Serves the raw JSON-LD @context file with application/ld+json content type for NGSI-LD brokers and IoT clients.",
        params: ContextFileProjectParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { project } = request.params;
        const contextFile = await fastify.prisma.projectContextFile.findUnique({
          where: { project },
        });

        if (!contextFile) {
          return reply.notFound(`No context file found for project '${project}'`);
        }

        reply.header("Content-Type", "application/ld+json; charset=utf-8");
        reply.header("ETag", `"${contextFile.id}-v${contextFile.version}"`);
        reply.header("Last-Modified", contextFile.updatedAt.toUTCString());

        return contextFile.file;
      } catch (error) {
        request.log.error(error, "Failed to serve raw context file");
        return reply.internalServerError("Failed to serve raw context file");
      }
    }
  );

  // ==========================================
  // POST /:project (Create or Update Context File)
  // ==========================================
  fastify.post(
    "/:project",
    {
      onRequest: [fastify.authenticateProject],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Create or Update Project FIWARE Context File",
        description: "Upserts the JSON-LD @context file for the given project. Automatically increments version on update.",
        security: [{ bearerAuth: [] }],
        params: ContextFileProjectParamsSchema,
        body: UpsertContextFileBodySchema,
        response: {
          200: ResponseMessageSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { project } = request.params;
        const { name, description, file } = request.body;

        const existing = await fastify.prisma.projectContextFile.findUnique({
          where: { project },
        });

        const contextFile = await fastify.prisma.projectContextFile.upsert({
          where: { project },
          create: {
            project,
            name: name ?? null,
            description: description ?? null,
            file,
            version: 1,
          },
          update: {
            name: name ?? null,
            description: description ?? null,
            file,
            version: existing ? existing.version + 1 : 1,
          },
        });

        return {
          message: "Context updated"
        };
      } catch (error) {
        request.log.error(error, "Failed to save project context file");
        return reply.internalServerError("Failed to save project context file");
      }
    }
  );

  // ==========================================
  // DELETE /:project (Delete Context File)
  // ==========================================
  fastify.delete(
    "/:project",
    {
      onRequest: [fastify.authenticateProject],
      schema: {
        tags: ["FIWARE Context File", "FIWARE"],
        summary: "Delete Project FIWARE Context File",
        description: "Deletes the context file for the specified project.",
        security: [{ bearerAuth: [] }],
        params: ContextFileProjectParamsSchema,
        response: {
          200: ResponseMessageSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { project } = request.params;

        const existing = await fastify.prisma.projectContextFile.findUnique({
          where: { project },
        });

        if (!existing) {
          return reply.notFound(`No context file found for project '${project}'`);
        }

        await fastify.prisma.projectContextFile.delete({
          where: { project },
        });

        return {
          message: `Context file for project '${project}' was deleted successfully.`,
        };
      } catch (error) {
        request.log.error(error, "Failed to delete project context file");
        return reply.internalServerError("Failed to delete project context file");
      }
    }
  );
};

export default contextFileRoutes;