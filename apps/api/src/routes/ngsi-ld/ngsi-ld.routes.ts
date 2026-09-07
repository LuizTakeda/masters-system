import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { HttpErrorSchema } from "@repo/types/commons";
import {
  NgsiLdNotificationPayloadSchema,
  type NgsiLdNotificationPayloadType,
} from "@repo/types/endpoints/ngsi-ld/subscription.endpoints";

/**
 * Extracts tenant name if embedded in deterministic subscription ID:
 * e.g. "urn:ngsi-ld:Subscription:myTenant:all-entities" -> "myTenant"
 */
function extractTenantFromSubscriptionId(
  subscriptionId?: string,
): string | null {
  if (!subscriptionId) return null;
  const match = subscriptionId.match(/^urn:ngsi-ld:Subscription:([^:]+):/);
  return match?.[1] || null;
}

const ngsiLdRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // ================================================================
  // POST /subscription (Full path: /api/ngsi-ld/subscription)
  // Webhook for Orion-LD Context Broker Notifications
  // ================================================================
  fastify.post(
    "/subscription",
    {
      schema: {
        tags: ["NGSI-LD Subscriptions", "FIWARE"],
        summary: "Webhook endpoint for Orion-LD subscription notifications",
        description:
          "Receives asynchronous entity notifications from Orion-LD and publishes them to the Fastify EventEmitter.",
        querystring: z.object({
          tenant: z
            .string()
            .optional()
            .describe("Optional tenant query parameter"),
        }),
        body: NgsiLdNotificationPayloadSchema.or(z.record(z.string(), z.any())),
        response: {
          204: z.null().describe("Notification received and dispatched"),
          400: HttpErrorSchema,
          500: HttpErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as NgsiLdNotificationPayloadType;
      const queryTenant = (request.query as { tenant?: string })?.tenant;

      // Resolve tenant from query string, headers, or subscription ID
      const tenant =
        queryTenant ||
        (request.headers["ngsild-tenant"] as string) ||
        (request.headers["fiware-service"] as string) ||
        extractTenantFromSubscriptionId(body?.subscriptionId) ||
        "default";

      request.log.info(
        {
          tenant,
          subscriptionId: body?.subscriptionId,
          entitiesCount: Array.isArray(body?.data) ? body.data.length : 0,
        },
        "Received NGSI-LD notification from Context Broker",
      );

      const emitter = fastify.ngsiLd.subscription.eventEmitter;

      // 1. Emit tenant-level notification event
      emitter.emit(`tenant:${tenant}`, body);

      // 2. Emit entity-specific events for fine-grained listeners
      if (Array.isArray(body?.data)) {
        for (const entity of body.data) {
          if (entity && typeof entity === "object" && "id" in entity) {
            const entityId = String(entity.id);
            emitter.emit(`tenant:${tenant}:entity:${entityId}`, entity);
            emitter.emit(`entity:${entityId}`, { tenant, entity });
          }
        }
      }

      // 3. Emit wildcard notification event
      emitter.emit("notification", {
        tenant,
        notification: body,
      });

      // Orion-LD expects a 200 or 204 response code to acknowledge successful delivery
      return reply.status(204).send(null);
    },
  );
};

export default ngsiLdRoutes;
