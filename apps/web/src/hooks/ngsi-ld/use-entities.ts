import useSWR, { mutate as globalMutate } from "swr";
import type {
  AppendEntityAttrsBodyType,
  AppendEntityAttrsQueryType,
  CreateEntityBodyType,
  DeleteEntityAttrQueryType,
  GetEntityQueryType,
  PartialUpdateEntityAttrBodyType,
  QueryEntitiesQueryType,
  UpdateEntityAttrsBodyType,
} from "@repo/types/endpoints/ngsi-ld/entities.endpoints";
import {
  appendEntityAttrs as apiAppendEntityAttrs,
  createEntity as apiCreateEntity,
  deleteEntity as apiDeleteEntity,
  deleteEntityAttr as apiDeleteEntityAttr,
  getEntity as apiGetEntity,
  partialUpdateEntityAttr as apiPartialUpdateEntityAttr,
  queryEntitiesWithCount as apiQueryEntitiesWithCount,
  type NgsiLdHeadersInput,
  updateEntityAttrs as apiUpdateEntityAttrs,
} from "../../services/ngsi-ld/entities.service";

//**************************************************
// Cache Keys & Helpers
//**************************************************

export const ENTITIES_BASE_KEY = "/ngsi-ld/v1/entities";

function extractTenant(headers?: NgsiLdHeadersInput | null): string | null {
  if (!headers) return null;

  const tenant =
    "ngsild-tenant" in headers && headers["ngsild-tenant"]
      ? headers["ngsild-tenant"]
      : "fiware-service" in headers && headers["fiware-service"]
        ? headers["fiware-service"]
        : "tenant" in headers && headers.tenant
          ? headers.tenant
          : "service" in headers && headers.service
            ? headers.service
            : null;

  return tenant || null;
}

export function getEntitiesKey(
  headers?: NgsiLdHeadersInput | null,
  query?: QueryEntitiesQueryType,
) {
  const tenant = extractTenant(headers);
  if (!tenant) return null;

  return [
    ENTITIES_BASE_KEY,
    tenant,
    query?.type ?? "*",
    query?.limit ?? 20,
    query?.offset ?? 0,
    query?.id ?? "",
    query?.idPattern ?? "",
    query?.attrs ?? "",
    query?.q ?? "",
    query?.options ?? "",
  ];
}

export function getEntityKey(
  headers?: NgsiLdHeadersInput | null,
  entityId?: string | null,
  query?: GetEntityQueryType,
) {
  const tenant = extractTenant(headers);
  if (!tenant || !entityId) return null;

  return [
    ENTITIES_BASE_KEY,
    tenant,
    "entity",
    entityId,
    query?.attrs ?? "",
    query?.options ?? "",
  ];
}

export async function invalidateEntities() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(ENTITIES_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(ENTITIES_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true },
  );
}

//**************************************************
// Hooks
//**************************************************

export interface UseEntitiesOptions {
  /**
   * Polling interval in milliseconds.
   * Defaults to 5000ms (5 seconds).
   * Set to 0 to disable automatic polling.
   */
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}

/**
 * Hook to query and manage a collection of NGSI-LD entities.
 */
export function useEntities(
  headers?: NgsiLdHeadersInput | null,
  query?: QueryEntitiesQueryType,
  options?: UseEntitiesOptions,
) {
  const key = getEntitiesKey(headers, query);

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    key,
    () => (headers ? apiQueryEntitiesWithCount(headers, query) : null),
    {
      refreshInterval: options?.refreshInterval ?? 5000,
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
    },
  );

  const create = async (entity: CreateEntityBodyType) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiCreateEntity(headers, entity);
    await invalidateEntities();
    return res;
  };

  const updateAttrs = async (
    entityId: string,
    body: UpdateEntityAttrsBodyType,
  ) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiUpdateEntityAttrs(headers, entityId, body);
    await invalidateEntities();
    return res;
  };

  const appendAttrs = async (
    entityId: string,
    body: AppendEntityAttrsBodyType,
    appendQuery?: AppendEntityAttrsQueryType,
  ) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiAppendEntityAttrs(
      headers,
      entityId,
      body,
      appendQuery,
    );
    await invalidateEntities();
    return res;
  };

  const partialUpdateAttr = async (
    entityId: string,
    attrId: string,
    body: PartialUpdateEntityAttrBodyType,
  ) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiPartialUpdateEntityAttr(
      headers,
      entityId,
      attrId,
      body,
    );
    await invalidateEntities();
    return res;
  };

  const deleteAttr = async (
    entityId: string,
    attrId: string,
    deleteQuery?: DeleteEntityAttrQueryType,
  ) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiDeleteEntityAttr(
      headers,
      entityId,
      attrId,
      deleteQuery,
    );
    await invalidateEntities();
    return res;
  };

  const remove = async (entityId: string) => {
    if (!headers) throw new Error("NGSI-LD tenant header is required");
    const res = await apiDeleteEntity(headers, entityId);
    await invalidateEntities();
    return res;
  };

  return {
    entities: data?.entities ?? [],
    count: data?.count ?? 0,
    data,
    isLoading,
    isValidating,
    isError: error,
    mutate,
    createEntity: create,
    updateEntityAttrs: updateAttrs,
    appendEntityAttrs: appendAttrs,
    partialUpdateEntityAttr: partialUpdateAttr,
    deleteEntityAttr: deleteAttr,
    deleteEntity: remove,
  };
}

/**
 * Hook to retrieve and manage a single NGSI-LD entity by ID.
 */
export function useEntity(
  headers?: NgsiLdHeadersInput | null,
  entityId?: string | null,
  query?: GetEntityQueryType,
) {
  const key = getEntityKey(headers, entityId, query);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers && entityId ? apiGetEntity(headers, entityId, query) : null,
  );

  const updateAttrs = async (body: UpdateEntityAttrsBodyType) => {
    if (!headers || !entityId) {
      throw new Error("NGSI-LD tenant header and entityId are required");
    }
    const res = await apiUpdateEntityAttrs(headers, entityId, body);
    await invalidateEntities();
    return res;
  };

  const appendAttrs = async (
    body: AppendEntityAttrsBodyType,
    appendQuery?: AppendEntityAttrsQueryType,
  ) => {
    if (!headers || !entityId) {
      throw new Error("NGSI-LD tenant header and entityId are required");
    }
    const res = await apiAppendEntityAttrs(
      headers,
      entityId,
      body,
      appendQuery,
    );
    await invalidateEntities();
    return res;
  };

  const partialUpdateAttr = async (
    attrId: string,
    body: PartialUpdateEntityAttrBodyType,
  ) => {
    if (!headers || !entityId) {
      throw new Error("NGSI-LD tenant header and entityId are required");
    }
    const res = await apiPartialUpdateEntityAttr(
      headers,
      entityId,
      attrId,
      body,
    );
    await invalidateEntities();
    return res;
  };

  const deleteAttr = async (
    attrId: string,
    deleteQuery?: DeleteEntityAttrQueryType,
  ) => {
    if (!headers || !entityId) {
      throw new Error("NGSI-LD tenant header and entityId are required");
    }
    const res = await apiDeleteEntityAttr(
      headers,
      entityId,
      attrId,
      deleteQuery,
    );
    await invalidateEntities();
    return res;
  };

  const remove = async () => {
    if (!headers || !entityId) {
      throw new Error("NGSI-LD tenant header and entityId are required");
    }
    const res = await apiDeleteEntity(headers, entityId);
    await invalidateEntities();
    return res;
  };

  return {
    entity: data,
    data,
    isLoading,
    isError: error,
    mutate,
    updateEntityAttrs: updateAttrs,
    appendEntityAttrs: appendAttrs,
    partialUpdateEntityAttr: partialUpdateAttr,
    deleteEntityAttr: deleteAttr,
    deleteEntity: remove,
  };
}
