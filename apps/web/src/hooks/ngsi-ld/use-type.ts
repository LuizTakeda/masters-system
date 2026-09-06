import { useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import type {
  EntityType,
  EntityTypeInfoType,
  EntityTypeListType,
  GetEntityTypesQueryType,
} from "@repo/types/endpoints/ngsi-ld/types.endpoints";
import {
  getEntityTypes as apiGetEntityTypes,
  getEntityTypeList as apiGetEntityTypeList,
  getEntityTypeInfo as apiGetEntityTypeInfo,
  type NgsiLdHeadersInput,
} from "../../services/ngsi-ld/types.service";

//**************************************************
// Cache Keys & Helpers
//**************************************************

export const TYPES_BASE_KEY = "/ngsi-ld/v1/types";

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

export function getEntityTypesKey(
  headers?: NgsiLdHeadersInput | null,
  query?: GetEntityTypesQueryType,
) {
  const tenant = extractTenant(headers);
  if (!tenant) return null;

  return [TYPES_BASE_KEY, tenant, query?.details ? "details" : "summary"];
}

export function getEntityTypeListKey(headers?: NgsiLdHeadersInput | null) {
  const tenant = extractTenant(headers);
  if (!tenant) return null;

  return [TYPES_BASE_KEY, tenant, "summary"];
}

export function getEntityTypeInfoKey(
  headers?: NgsiLdHeadersInput | null,
  type?: string | null,
) {
  const tenant = extractTenant(headers);
  if (!tenant || !type) return null;

  return [TYPES_BASE_KEY, tenant, "info", type];
}

export async function invalidateEntityTypes() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(TYPES_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(TYPES_BASE_KEY);
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

/**
 * Hook to retrieve entity types (supports both summary and detailed modes).
 */
export function useEntityTypes(
  headers?: NgsiLdHeadersInput | null,
  query?: GetEntityTypesQueryType,
) {
  const key = getEntityTypesKey(headers, query);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers ? apiGetEntityTypes(headers, query) : null,
  );

  // Normalize typeList whether details is on or off
  const typeList: string[] = useMemo(() => {
    if (!data) return [];
    if ("typeList" in data && Array.isArray(data.typeList)) {
      return data.typeList;
    }
    if (Array.isArray(data)) {
      return data.map((item) => item.typeName);
    }
    return [];
  }, [data]);

  return {
    data,
    typeList,
    types: Array.isArray(data) ? (data as EntityType[]) : [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Convenience hook to retrieve a simple list of available entity type names.
 * Ideal for populating select dropdowns, tabs, and filters.
 */
export function useEntityTypeList(headers?: NgsiLdHeadersInput | null) {
  const key = getEntityTypeListKey(headers);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers ? apiGetEntityTypeList(headers) : null,
  );

  return {
    typeList: data?.typeList ?? [],
    data: data as EntityTypeListType | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to retrieve detailed information about a single entity type (count and attribute specs).
 */
export function useEntityTypeInfo(
  headers?: NgsiLdHeadersInput | null,
  type?: string | null,
) {
  const key = getEntityTypeInfoKey(headers, type);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers && type ? apiGetEntityTypeInfo(headers, type) : null,
  );

  return {
    typeInfo: data as EntityTypeInfoType | undefined,
    data: data as EntityTypeInfoType | undefined,
    entityCount: data?.entityCount ?? 0,
    attributeDetails: data?.attributeDetails ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
