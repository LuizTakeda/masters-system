import type { HttpErrorType } from "@repo/types/commons";
import {
  type EntityType,
  type EntityTypeListType,
  type GetEntityTypesQueryType,
  GetEntityTypesResponseSchema,
  type GetEntityTypesResponseType,
  GetEntityTypesSummaryResponseSchema,
  GetEntityTypesDetailedResponseSchema,
  GetEntityTypeInfoResponseSchema,
  type GetEntityTypeInfoResponseType,
  type NgsiLdHeadersType,
} from "@repo/types/endpoints/ngsi-ld/types.endpoints";

//**************************************************
// Types & Helpers
//**************************************************

export type NgsiLdHeadersInput =
  | NgsiLdHeadersType
  | {
      tenant?: string;
      service?: string;
      servicePath?: string;
      link?: string;
    };

function normalizeHeaders(headers: NgsiLdHeadersInput): Record<string, string> {
  const normalized: Record<string, string> = {
    Accept: "application/json",
  };

  const tenant =
    "ngsild-tenant" in headers && headers["ngsild-tenant"]
      ? headers["ngsild-tenant"]
      : "fiware-service" in headers && headers["fiware-service"]
        ? headers["fiware-service"]
        : "tenant" in headers && headers.tenant
          ? headers.tenant
          : "service" in headers && headers.service
            ? headers.service
            : undefined;

  if (tenant) {
    normalized["NGSILD-Tenant"] = tenant;
    normalized["Fiware-Service"] = tenant;
  }

  const servicePath =
    "fiware-servicepath" in headers && headers["fiware-servicepath"]
      ? headers["fiware-servicepath"]
      : "servicePath" in headers && headers.servicePath
        ? headers.servicePath
        : undefined;

  if (servicePath) {
    normalized["Fiware-ServicePath"] = servicePath;
  }

  if ("link" in headers && headers.link) {
    normalized["Link"] = headers.link;
  }

  return normalized;
}

async function handleResponse<T>(
  response: Response,
  validate?: (data: unknown) => { success: boolean; data?: T },
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorPayload: HttpErrorType = {
      statusCode: response.status,
      error:
        data?.title ||
        data?.name ||
        data?.error ||
        "NGSI-LD Context Broker Error",
      message:
        data?.detail ||
        data?.message ||
        data?.description ||
        response.statusText,
    };
    throw errorPayload;
  }

  if (validate && data) {
    const validation = validate(data);
    if (!validation.success) {
      throw {
        statusCode: 500,
        error: "Contract Error",
        message:
          "The server response is incompatible with the expected contract.",
      } as HttpErrorType;
    }
    return validation.data as T;
  }

  return data as T;
}

//**************************************************
// NGSI-LD Types Endpoints (clause 5.7.5 - 5.7.7)
//**************************************************

/**
 * Retrieve available entity types for the given tenant.
 * GET /ngsi-ld/v1/types
 */
export async function getEntityTypes(
  headers: NgsiLdHeadersInput,
  query?: GetEntityTypesQueryType,
): Promise<GetEntityTypesResponseType> {
  const searchParams = new URLSearchParams();

  if (query?.details !== undefined) {
    searchParams.set("details", String(query.details));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/ngsi-ld/v1/types?${queryString}`
    : "/ngsi-ld/v1/types";

  const response = await fetch(url, {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  return handleResponse<GetEntityTypesResponseType>(response, (data) =>
    GetEntityTypesResponseSchema.safeParse(data),
  );
}

/**
 * Convenience helper to retrieve simple entity type names list (details=false).
 * GET /ngsi-ld/v1/types?details=false
 */
export async function getEntityTypeList(
  headers: NgsiLdHeadersInput,
): Promise<EntityTypeListType> {
  const response = await fetch("/ngsi-ld/v1/types", {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  return handleResponse<EntityTypeListType>(response, (data) =>
    GetEntityTypesSummaryResponseSchema.safeParse(data),
  );
}

/**
 * Convenience helper to retrieve detailed entity types list with attribute names (details=true).
 * GET /ngsi-ld/v1/types?details=true
 */
export async function getEntityTypesDetailed(
  headers: NgsiLdHeadersInput,
): Promise<EntityType[]> {
  const response = await fetch("/ngsi-ld/v1/types?details=true", {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  return handleResponse<EntityType[]>(response, (data) =>
    GetEntityTypesDetailedResponseSchema.safeParse(data),
  );
}

/**
 * Retrieve detailed entity type information (count of instances, attribute specs).
 * GET /ngsi-ld/v1/types/{type}
 */
export async function getEntityTypeInfo(
  headers: NgsiLdHeadersInput,
  type: string,
): Promise<GetEntityTypeInfoResponseType> {
  const response = await fetch(
    `/ngsi-ld/v1/types/${encodeURIComponent(type)}`,
    {
      method: "GET",
      headers: normalizeHeaders(headers),
    },
  );

  return handleResponse<GetEntityTypeInfoResponseType>(response, (data) =>
    GetEntityTypeInfoResponseSchema.safeParse(data),
  );
}
