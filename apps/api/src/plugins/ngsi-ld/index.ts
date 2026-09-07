import fp from "fastify-plugin";
import { EventEmitter } from "node:events";
import type { FastifyInstance } from "fastify";
import {
  createTenantSubscription,
  getTenantSubscription,
  getTenantSubscriptionId,
} from "./subscription.service.js";

export type NGSILDSubcriptionAPI = {
  eventEmitter: EventEmitter;
  ensureTenantSubscription: (tenant: string) => Promise<void>;
};

declare module "fastify" {
  interface FastifyInstance {
    ngsiLd: {
      subscription: NGSILDSubcriptionAPI;
    };
  }
}

const subscriptionList = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<void>>();

async function ensureTenantSubscription(tenant: string): Promise<void> {
  if (subscriptionList.has(tenant)) {
    return;
  }

  // Deduplicate concurrent calls for the same tenant
  let inFlight = inFlightRequests.get(tenant);
  if (!inFlight) {
    inFlight = (async () => {
      try {
        // 1. Check if subscription already exists in the Context Broker
        const existing = await getTenantSubscription(tenant);
        if (existing?.id) {
          subscriptionList.set(tenant, existing.id);
          return;
        }

        // 2. If it does not exist, create it in the Context Broker
        const created = await createTenantSubscription(tenant);
        subscriptionList.set(tenant, created.id);
      } catch (error: any) {
        // If 409 Conflict occurs (created concurrently in broker), record ID and resolve safely
        if (error?.statusCode === 409) {
          subscriptionList.set(tenant, getTenantSubscriptionId(tenant));
          return;
        }
        throw error;
      } finally {
        inFlightRequests.delete(tenant);
      }
    })();

    inFlightRequests.set(tenant, inFlight);
  }

  await inFlight;
}

export default fp(async (fastify: FastifyInstance) => {
  const ngsiLdSubcription: NGSILDSubcriptionAPI = {
    eventEmitter: new EventEmitter(),
    ensureTenantSubscription,
  };

  ngsiLdSubcription.eventEmitter.setMaxListeners(100);

  fastify.decorate("ngsiLd", { subscription: ngsiLdSubcription });

  fastify.addHook("onClose", async () => {
    fastify.ngsiLd.subscription.eventEmitter.removeAllListeners();
  });
});
