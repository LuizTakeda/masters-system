import sensible, { type HttpErrorCodesLoose } from "@fastify/sensible";
import {
  type CreateSubscriptionBodyType,
  GetSubscriptionResponseSchema,
  type SubscriptionType,
} from "@repo/types/endpoints/ngsi-ld/subscription.endpoints";

const httpErrors = sensible.httpErrors;

//##################################################
// Configuration
//##################################################

export const DEFAULT_ORION_BASE_URL =
  process.env.ORION_LD_URL || "http://orion-ld:1026";

export const DEFAULT_WEBHOOK_URL =
  process.env.NGSI_LD_WEBHOOK_URL ||
  "http://workspace:3000/api/ngsi-ld/subscription";

export const SUBSCRIPTIONS_BASE_PATH = "/ngsi-ld/v1/subscriptions";

//##################################################
// Error Handling Helper (Fastify Sensible)
//##################################################

/**
 * Translates an HTTP error response from Orion-LD into the appropriate Fastify Sensible HttpError.
 */
async function translateBrokerError(response: Response): Promise<never> {
  const status = response.status;
  const data = await response.json().catch(() => null);

  const message =
    data?.detail ||
    data?.message ||
    data?.description ||
    data?.title ||
    response.statusText ||
    `Context Broker HTTP Error ${status}`;

  if (status >= 400 && status < 600) {
    throw httpErrors.getHttpError(status as HttpErrorCodesLoose, message);
  }

  throw httpErrors.internalServerError(
    `Unexpected Context Broker Error (${status}): ${message}`,
  );
}

//##################################################
// Helpers
//##################################################

/**
 * Generates a deterministic subscription URI identifying the tenant.
 * e.g. "urn:ngsi-ld:Subscription:tenantA:all-entities"
 */
export function getTenantSubscriptionId(tenant: string): string {
  return `urn:ngsi-ld:Subscription:${tenant}:all-entities`;
}

/**
 * Builds canonical NGSI-LD and Fiware headers for tenant isolation.
 */
function getTenantHeaders(tenant: string): Record<string, string> {
  return {
    "NGSILD-Tenant": tenant,
    "Fiware-Service": tenant,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

//##################################################
// Service Functions
//##################################################

/**
 * Checks whether a subscription for events exists for the specified tenant.
 * Returns the Subscription if found, or null if it does not exist (404).
 *
 * @param tenant - The target tenant identifier
 * @param baseUrl - Optional custom base URL for the Orion-LD Context Broker
 * @returns The subscription object or null if not found
 */
export async function getTenantSubscription(
  tenant: string,
  baseUrl: string = DEFAULT_ORION_BASE_URL,
): Promise<SubscriptionType | null> {
  const subscriptionId = getTenantSubscriptionId(tenant);
  const url = new URL(
    `${SUBSCRIPTIONS_BASE_PATH}/${encodeURIComponent(subscriptionId)}`,
    baseUrl,
  );

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getTenantHeaders(tenant),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    await translateBrokerError(response);
  }

  const data = await response.json().catch(() => null);
  const validation = GetSubscriptionResponseSchema.safeParse(data);

  if (!validation.success) {
    throw httpErrors.internalServerError(
      "Context Broker response did not match expected subscription schema contract",
    );
  }

  return validation.data as SubscriptionType;
}

export interface CreateTenantSubscriptionResult {
  id: string;
  location: string | null;
}

/**
 * Retrieves existing entity types for a tenant from Orion-LD, defaulting to ["Device"].
 */
export async function getTenantTypes(
  tenant: string,
  baseUrl: string = DEFAULT_ORION_BASE_URL,
): Promise<string[]> {
  const url = new URL("/ngsi-ld/v1/types", baseUrl);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getTenantHeaders(tenant),
  });

  if (!response.ok) {
    return ["Device"];
  }

  const data = (await response.json().catch(() => null)) as {
    typeList?: string[];
  };
  const list = Array.isArray(data?.typeList) ? data.typeList : [];
  return list.length > 0 ? list : ["Device"];
}

/**
 * Creates a subscription for all entities of a specific tenant.
 * Configured so Orion-LD posts notifications to http://workspace:3000/api/ngsi-ld/subscription.
 *
 * @param tenant - The target tenant identifier
 * @param baseUrl - Optional custom base URL for the Orion-LD Context Broker
 * @returns The created subscription ID and Location header
 */
export async function createTenantSubscription(
  tenant: string,
  baseUrl: string = DEFAULT_ORION_BASE_URL,
): Promise<CreateTenantSubscriptionResult> {
  const subscriptionId = getTenantSubscriptionId(tenant);
  const url = new URL(SUBSCRIPTIONS_BASE_PATH, baseUrl);

  // Orion-LD requires explicit entity types in subscriptions to trigger notifications
  const types = await getTenantTypes(tenant, baseUrl);
  const entities = types.map((type) => ({ type }));

  const payload: CreateSubscriptionBodyType = {
    id: subscriptionId,
    type: "Subscription",
    subscriptionName: `realtime-subscription-${tenant}`,
    description: `Realtime updates stream for all entities of tenant ${tenant}`,
    entities,
    notification: {
      endpoint: {
        uri: DEFAULT_WEBHOOK_URL,
        accept: "application/json",
      },
      format: "keyValues",
    },
  };

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: getTenantHeaders(tenant),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await translateBrokerError(response);
  }

  const location = response.headers.get("location");

  return {
    id: subscriptionId,
    location,
  };
}

/**
 * Deletes the subscription corresponding to the specified tenant.
 *
 * @param tenant - The target tenant identifier
 * @param baseUrl - Optional custom base URL for the Orion-LD Context Broker
 */
export async function deleteTenantSubscription(
  tenant: string,
  baseUrl: string = DEFAULT_ORION_BASE_URL,
): Promise<void> {
  const subscriptionId = getTenantSubscriptionId(tenant);
  const url = new URL(
    `${SUBSCRIPTIONS_BASE_PATH}/${encodeURIComponent(subscriptionId)}`,
    baseUrl,
  );

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: getTenantHeaders(tenant),
  });

  if (!response.ok) {
    await translateBrokerError(response);
  }
}
