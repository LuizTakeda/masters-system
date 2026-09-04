import useSWR, { mutate as globalMutate } from "swr";
import type {
  CreateDeviceItemType,
  CreateDevicesBodyType,
  GetDevicesQueryType,
  UpdateDeviceBodyType,
} from "@repo/types/endpoints/iot-agent/device.endpoints";
import {
  createDevice as apiCreateDevice,
  createDevices as apiCreateDevices,
  deleteDevice as apiDeleteDevice,
  getDevice as apiGetDevice,
  getDevices as apiGetDevices,
  type IotHeadersInput,
  updateDevice as apiUpdateDevice,
} from "../../services/iot-agent/device.service";

//**************************************************
// Cache Keys & Helpers
//**************************************************

export const DEVICES_BASE_KEY = "/iot/devices";

export function getDevicesKey(
  headers?: IotHeadersInput | null,
  query?: GetDevicesQueryType,
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
    DEVICES_BASE_KEY,
    service,
    servicePath,
    query?.limit ?? 20,
    query?.offset ?? 0,
    query?.detailed ?? "off",
    query?.entity ?? "",
    query?.protocol ?? "",
    query?.device_id ?? "",
  ];
}

export function getDeviceKey(
  headers?: IotHeadersInput | null,
  deviceId?: string | null,
) {
  if (!headers || !deviceId) return null;

  const service =
    "fiware-service" in headers ? headers["fiware-service"] : headers.service;
  const servicePath =
    "fiware-servicepath" in headers
      ? headers["fiware-servicepath"]
      : headers.servicePath || "/";

  if (!service) return null;

  return [DEVICES_BASE_KEY, service, servicePath, deviceId];
}

export async function invalidateDevices() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(DEVICES_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(DEVICES_BASE_KEY);
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
 * Hook to manage devices list, creation, update, and deletion.
 */
export function useDevices(
  headers?: IotHeadersInput | null,
  query?: GetDevicesQueryType,
) {
  const key = getDevicesKey(headers, query);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers ? apiGetDevices(headers, query) : null,
  );

  const create = async (device: CreateDeviceItemType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiCreateDevice(headers, device);
    await invalidateDevices();
    return res;
  };

  const createMany = async (body: CreateDevicesBodyType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiCreateDevices(headers, body);
    await invalidateDevices();
    return res;
  };

  const update = async (deviceId: string, body: UpdateDeviceBodyType) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiUpdateDevice(headers, deviceId, body);
    await invalidateDevices();
    return res;
  };

  const remove = async (deviceId: string) => {
    if (!headers) throw new Error("Fiware headers are required");
    const res = await apiDeleteDevice(headers, deviceId);
    await invalidateDevices();
    return res;
  };

  return {
    devices: data?.devices ?? [],
    count: data?.count ?? 0,
    data,
    isLoading,
    isError: error,
    mutate,
    createDevice: create,
    createDevices: createMany,
    updateDevice: update,
    deleteDevice: remove,
  };
}

/**
 * Hook to retrieve and manage a single device by ID.
 */
export function useDevice(
  headers?: IotHeadersInput | null,
  deviceId?: string | null,
) {
  const key = getDeviceKey(headers, deviceId);

  const { data, error, isLoading, mutate } = useSWR(key, () =>
    headers && deviceId ? apiGetDevice(headers, deviceId) : null,
  );

  const update = async (body: UpdateDeviceBodyType) => {
    if (!headers || !deviceId) {
      throw new Error("Fiware headers and device_id are required");
    }
    const res = await apiUpdateDevice(headers, deviceId, body);
    await invalidateDevices();
    return res;
  };

  const remove = async () => {
    if (!headers || !deviceId) {
      throw new Error("Fiware headers and device_id are required");
    }
    const res = await apiDeleteDevice(headers, deviceId);
    await invalidateDevices();
    return res;
  };

  return {
    device: data,
    data,
    isLoading,
    isError: error,
    mutate,
    updateDevice: update,
    deleteDevice: remove,
  };
}
