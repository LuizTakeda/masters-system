import useSWR, { mutate as globalMutate } from "swr";
import type {
  CreateServiceItemType,
  CreateServicesBodyType,
  DeleteServiceQueryType,
  GetServicesQueryType,
  UpdateServiceBodyType,
  UpdateServiceQueryType,
} from "@repo/types/endpoints/iot-agent/service.endpoints";
import {
  createService as apiCreateService,
  createServices as apiCreateServices,
  deleteService as apiDeleteService,
  getServices as apiGetServices,
  type IotHeadersInput,
  updateService as apiUpdateService,
} from "../../services/iot-agent/service.service";

//**************************************************
// Cache Keys & Helpers
//**************************************************

export const SERVICES_BASE_KEY = "/iot/services";

export function getServicesKey(
  headers?: IotHeadersInput | null,
  query?: GetServicesQueryType,
) {
  if (!headers) return null;

  const service =
    "fiware-service" in headers ? headers["fiware-service"] : headers.service;
  const servicePath =
    "fiware-servicepath" in headers
      ? headers["fiware-servicepath"]
      : headers.servicePath || "/";

  if (!service) return null;

  return [
    SERVICES_BASE_KEY,
    service,
    servicePath,
    query?.limit ?? 20,
    query?.offset ?? 0,
    query?.resource ?? "",
  ];
}

export async function invalidateServices() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(SERVICES_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(SERVICES_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true },
  );
}

//**************************************************
// Hook
//**************************************************

export function useServices(
  headers?: IotHeadersInput | null,
  query?: GetServicesQueryType,
) {
  const key = getServicesKey(headers, query);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers ? apiGetServices(headers, query) : null,
  );

  const create = async (service: CreateServiceItemType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiCreateService(headers, service);
    await invalidateServices();
    return res;
  };

  const createMany = async (body: CreateServicesBodyType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiCreateServices(headers, body);
    await invalidateServices();
    return res;
  };

  const update = async (
    updateQuery: UpdateServiceQueryType,
    body: UpdateServiceBodyType,
  ) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiUpdateService(headers, updateQuery, body);
    await invalidateServices();
    return res;
  };

  const remove = async (deleteQuery: DeleteServiceQueryType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiDeleteService(headers, deleteQuery);
    await invalidateServices();
    return res;
  };

  return {
    services: data?.services ?? [],
    count: data?.count ?? 0,
    data,
    isLoading,
    isError: error,
    mutate,
    createService: create,
    createServices: createMany,
    updateService: update,
    deleteService: remove,
  };
}
