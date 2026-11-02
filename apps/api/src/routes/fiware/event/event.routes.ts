import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { HttpErrorSchema } from "@repo/types/commons";

const EventQuerySchema = z.object({
  tenant: z
    .string()
    .min(1, "tenant is required")
    .describe("Target tenant identifier"),
  entityId: z
    .string()
    .optional()
    .describe(
      "Optional entity URI filter to receive updates for a single entity",
    ),
});

const eventRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // ================================================================
  // GET / (Full path: /api/fiware/event)
  // Connect to realtime NGSI-LD events stream via Server-Sent Events (SSE)
  // ================================================================
  fastify.get(
    "",
    {
      sse: "only",
      schema: {
        tags: ["FIWARE Events", "FIWARE"],
        summary: "Stream real-time entity updates for a tenant via SSE",
        description:
          "Establishes a persistent Server-Sent Events (SSE) connection. Ensures that the Orion-LD Context Broker subscription exists for the specified tenant, and dispatches real-time entity events as they arrive.",
        querystring: EventQuerySchema,
        response: {
          400: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { tenant, entityId } = request.query;

      // 1. Disable proxy buffering for NGINX & HTTP caching
      reply.header("X-Accel-Buffering", "no");
      reply.header("Cache-Control", "no-cache, no-transform");

      // 2. Ensure Orion-LD Context Broker has an active subscription for this tenant
      try {
        await fastify.ngsiLd.subscription.ensureTenantSubscription(tenant);
      } catch (error) {
        request.log.error(
          { error, tenant },
          "Failed to ensure Orion-LD subscription for tenant",
        );
        throw error;
      }

      // 3. Keep the SSE connection alive
      reply.sse.keepAlive();

      // 4. Send initial connection confirmation event to client
      await reply.sse.send({
        event: "connected",
        data: {
          tenant,
          entityId: entityId || null,
          timestamp: new Date().toISOString(),
          message: `Subscribed to real-time events for tenant '${tenant}'`,
        },
      });

      // 5. Determine target channel based on presence of entityId filter
      const channel = entityId
        ? `tenant:${tenant}:entity:${entityId}`
        : `tenant:${tenant}`;

      // 6. Listener to forward EventEmitter notifications to client via SSE
      const onUpdate = (data: unknown) => {
        reply.sse
          .send({
            event: "entity-update",
            data,
          })
          .catch((error) => {
            request.log.error(
              { error, channel },
              "Failed to dispatch SSE event to client",
            );
          });
      };

      fastify.ngsiLd.subscription.eventEmitter.on(channel, onUpdate);

      // 7. Clean up listener when client closes the connection
      request.raw.on("close", () => {
        fastify.ngsiLd.subscription.eventEmitter.off(channel, onUpdate);
        request.log.info(
          `Client disconnected from SSE stream (tenant: ${tenant}, channel: ${channel})`,
        );
      });
    },
  );
};

export default eventRoutes;
