import type { HttpErrorType } from "@repo/types/commons";
import {
  type AppendEntityAttrsBodyType,
  type AppendEntityAttrsQueryType,
  type CreateEntityBodyType,
  type DeleteEntityAttrQueryType,
  GetEntityResponseSchema,
  type GetEntityResponseType,
  type GetEntityQueryType,
  type NgsiLdEntityType,
  type NgsiLdHeadersType,
  type PartialUpdateEntityAttrBodyType,
  QueryEntitiesResponseSchema,
  type QueryEntitiesQueryType,
  type QueryEntitiesResponseType,
  type UpdateEntityAttrsBodyType,
} from "@repo/types/endpoints/ngsi-ld/entities.endpoints";

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
// NGSI-LD Entities Endpoints (clause 5.6 & 5.7)
//**************************************************

/**
 * Query entities matching specified filters.
 * GET /ngsi-ld/v1/entities
 */
export async function queryEntities(
  headers: NgsiLdHeadersInput,
  query?: QueryEntitiesQueryType,
): Promise<QueryEntitiesResponseType> {
  const searchParams = new URLSearchParams();

  if (query?.type) {
    searchParams.set("type", query.type);
  }
  if (query?.id) {
    searchParams.set("id", query.id);
  }
  if (query?.idPattern) {
    searchParams.set("idPattern", query.idPattern);
  }
  if (query?.attrs) {
    searchParams.set("attrs", query.attrs);
  }
  if (query?.q) {
    searchParams.set("q", query.q);
  }
  if (query?.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }
  if (query?.options) {
    searchParams.set("options", query.options);
  }
  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.georel) {
    searchParams.set("georel", query.georel);
  }
  if (query?.geometry) {
    searchParams.set("geometry", query.geometry);
  }
  if (query?.coordinates) {
    searchParams.set("coordinates", query.coordinates);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/ngsi-ld/v1/entities?${queryString}`
    : "/ngsi-ld/v1/entities";

  const response = await fetch(url, {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  return handleResponse<QueryEntitiesResponseType>(response, (data) =>
    QueryEntitiesResponseSchema.safeParse(data),
  );
}

/**
 * Query entities and extract total count from NGSILD-Results-Count header.
 * GET /ngsi-ld/v1/entities?count=true
 */
export async function queryEntitiesWithCount(
  headers: NgsiLdHeadersInput,
  query?: QueryEntitiesQueryType,
): Promise<{ entities: NgsiLdEntityType[]; count: number }> {
  const searchParams = new URLSearchParams();

  // Always enable count
  searchParams.set("count", "true");

  if (query?.type) {
    searchParams.set("type", query.type);
  }
  if (query?.id) {
    searchParams.set("id", query.id);
  }
  if (query?.idPattern) {
    searchParams.set("idPattern", query.idPattern);
  }
  if (query?.attrs) {
    searchParams.set("attrs", query.attrs);
  }
  if (query?.q) {
    searchParams.set("q", query.q);
  }
  if (query?.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }
  if (query?.options) {
    searchParams.set("options", query.options);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/ngsi-ld/v1/entities?${queryString}`
    : "/ngsi-ld/v1/entities";

  const response = await fetch(url, {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  const rawCountHeader =
    response.headers.get("NGSILD-Results-Count") ||
    response.headers.get("Fiware-Total-Count");

  const entities = await handleResponse<QueryEntitiesResponseType>(
    response,
    (data) => QueryEntitiesResponseSchema.safeParse(data),
  );

  const count =
    rawCountHeader !== null ? Number(rawCountHeader) : entities.length;

  return { entities, count: isNaN(count) ? entities.length : count };
}

/**
 * Retrieve single entity by ID.
 * GET /ngsi-ld/v1/entities/{entityId}
 */
export async function getEntity(
  headers: NgsiLdHeadersInput,
  entityId: string,
  query?: GetEntityQueryType,
): Promise<GetEntityResponseType> {
  const searchParams = new URLSearchParams();

  if (query?.attrs) {
    searchParams.set("attrs", query.attrs);
  }
  if (query?.options) {
    searchParams.set("options", query.options);
  }

  const queryString = searchParams.toString();
  const basePath = `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`;
  const url = queryString ? `${basePath}?${queryString}` : basePath;

  const response = await fetch(url, {
    method: "GET",
    headers: normalizeHeaders(headers),
  });

  return handleResponse<GetEntityResponseType>(response, (data) =>
    GetEntityResponseSchema.safeParse(data),
  );
}

/**
 * Create a new NGSI-LD entity.
 * POST /ngsi-ld/v1/entities
 */
export async function createEntity(
  headers: NgsiLdHeadersInput,
  entity: CreateEntityBodyType,
): Promise<{ id: string; location?: string }> {
  const response = await fetch("/ngsi-ld/v1/entities", {
    method: "POST",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entity),
  });

  await handleResponse(response);
  const location = response.headers.get("Location") || undefined;

  return { id: entity.id, location };
}

/**
 * Update entity attributes (merges or overwrites specified attributes).
 * PATCH /ngsi-ld/v1/entities/{entityId}/attrs
 */
export async function updateEntityAttrs(
  headers: NgsiLdHeadersInput,
  entityId: string,
  body: UpdateEntityAttrsBodyType,
): Promise<{ message: string }> {
  const response = await fetch(
    `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`,
    {
      method: "PATCH",
      headers: {
        ...normalizeHeaders(headers),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  await handleResponse(response);
  return { message: "Entity attributes updated successfully" };
}

/**
 * Append entity attributes to an existing entity.
 * POST /ngsi-ld/v1/entities/{entityId}/attrs
 */
export async function appendEntityAttrs(
  headers: NgsiLdHeadersInput,
  entityId: string,
  body: AppendEntityAttrsBodyType,
  query?: AppendEntityAttrsQueryType,
): Promise<{ message: string }> {
  const searchParams = new URLSearchParams();

  if (query?.options) {
    searchParams.set("options", query.options);
  }

  const queryString = searchParams.toString();
  const basePath = `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`;
  const url = queryString ? `${basePath}?${queryString}` : basePath;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response);
  return { message: "Entity attributes appended successfully" };
}

/**
 * Partially update a single attribute of an entity.
 * PATCH /ngsi-ld/v1/entities/{entityId}/attrs/{attrId}
 */
export async function partialUpdateEntityAttr(
  headers: NgsiLdHeadersInput,
  entityId: string,
  attrId: string,
  body: PartialUpdateEntityAttrBodyType,
): Promise<{ message: string }> {
  const response = await fetch(
    `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs/${encodeURIComponent(attrId)}`,
    {
      method: "PATCH",
      headers: {
        ...normalizeHeaders(headers),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  await handleResponse(response);
  return { message: "Entity attribute partially updated successfully" };
}

/**
 * Delete a single attribute from an entity.
 * DELETE /ngsi-ld/v1/entities/{entityId}/attrs/{attrId}
 */
export async function deleteEntityAttr(
  headers: NgsiLdHeadersInput,
  entityId: string,
  attrId: string,
  query?: DeleteEntityAttrQueryType,
): Promise<{ message: string }> {
  const searchParams = new URLSearchParams();

  if (query?.datasetId) {
    searchParams.set("datasetId", query.datasetId);
  }
  if (query?.deleteAll !== undefined) {
    searchParams.set("deleteAll", String(query.deleteAll));
  }

  const queryString = searchParams.toString();
  const basePath = `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs/${encodeURIComponent(attrId)}`;
  const url = queryString ? `${basePath}?${queryString}` : basePath;

  const response = await fetch(url, {
    method: "DELETE",
    headers: normalizeHeaders(headers),
  });

  await handleResponse(response);
  return { message: "Entity attribute deleted successfully" };
}

/**
 * Delete an entire entity from Context Broker.
 * DELETE /ngsi-ld/v1/entities/{entityId}
 */
export async function deleteEntity(
  headers: NgsiLdHeadersInput,
  entityId: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`,
    {
      method: "DELETE",
      headers: normalizeHeaders(headers),
    },
  );

  await handleResponse(response);
  return { message: "Entity deleted successfully" };
}
