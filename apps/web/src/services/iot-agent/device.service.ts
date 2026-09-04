import type { HttpErrorType } from "@repo/types/commons";
import {
  type CreateDeviceItemType,
  type CreateDevicesBodyType,
  type GetDeviceResponseType,
  GetDeviceResponseSchema,
  type GetDevicesQueryType,
  GetDevicesResponseSchema,
  type GetDevicesResponseType,
  type UpdateDeviceBodyType,
} from "@repo/types/endpoints/iot-agent/device.endpoints";
import type { IotAgentHeadersType } from "@repo/types/endpoints/iot-agent/service.endpoints";

//**************************************************
// Types & Helpers
//**************************************************

export type IotHeadersInput =
  | IotAgentHeadersType
  | {
      service: string;
      servicePath?: string;
    };

function normalizeHeaders(headers: IotHeadersInput): Record<string, string> {
  const fiwareService =
    "fiware-service" in headers ? headers["fiware-service"] : headers.service;
  const fiwareServicePath =
    "fiware-servicepath" in headers
      ? headers["fiware-servicepath"]
      : headers.servicePath || "/";

  return {
    "fiware-service": fiwareService,
    "fiware-servicepath": fiwareServicePath,
  };
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
      error: data?.name || data?.error || "IoT Agent Error",
      message: data?.message || data?.description || response.statusText,
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
// Device Endpoints
//**************************************************

/**
 * Retrieve devices under the given tenant/subservice.
 * GET /iot/devices
 */
export async function getDevices(
  headers: IotHeadersInput,
  query?: GetDevicesQueryType,
): Promise<GetDevicesResponseType> {
  const searchParams = new URLSearchParams();

  if (query?.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }
  if (query?.detailed) {
    searchParams.set("detailed", query.detailed);
  }
  if (query?.entity) {
    searchParams.set("entity", query.entity);
  }
  if (query?.protocol) {
    searchParams.set("protocol", query.protocol);
  }
  if (query?.device_id) {
    searchParams.set("device_id", query.device_id);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/iot/devices?${queryString}` : "/iot/devices";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...normalizeHeaders(headers),
      Accept: "application/json",
    },
  });

  return handleResponse<GetDevicesResponseType>(response, (data) =>
    GetDevicesResponseSchema.safeParse(data),
  );
}

/**
 * Retrieve single device details by device_id.
 * GET /iot/devices/{device_id}
 */
export async function getDevice(
  headers: IotHeadersInput,
  deviceId: string,
): Promise<GetDeviceResponseType> {
  const response = await fetch(`/iot/devices/${encodeURIComponent(deviceId)}`, {
    method: "GET",
    headers: {
      ...normalizeHeaders(headers),
      Accept: "application/json",
    },
  });

  return handleResponse<GetDeviceResponseType>(response, (data) =>
    GetDeviceResponseSchema.safeParse(data),
  );
}

/**
 * Provision multiple devices in batch.
 * POST /iot/devices
 */
export async function createDevices(
  headers: IotHeadersInput,
  body: CreateDevicesBodyType,
): Promise<{ message: string }> {
  const response = await fetch("/iot/devices", {
    method: "POST",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response);
  return { message: "Devices provisioned successfully" };
}

/**
 * Convenience helper to provision a single device.
 * POST /iot/devices
 */
export async function createDevice(
  headers: IotHeadersInput,
  device: CreateDeviceItemType,
): Promise<{ message: string }> {
  return createDevices(headers, { devices: [device] });
}

/**
 * Update an existing device configuration.
 * PUT /iot/devices/{device_id}
 */
export async function updateDevice(
  headers: IotHeadersInput,
  deviceId: string,
  body: UpdateDeviceBodyType,
): Promise<{ message: string }> {
  const response = await fetch(`/iot/devices/${encodeURIComponent(deviceId)}`, {
    method: "PUT",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response);
  return { message: "Device updated successfully" };
}

/**
 * Delete a device from the IoT Agent registry.
 * DELETE /iot/devices/{device_id}
 */
export async function deleteDevice(
  headers: IotHeadersInput,
  deviceId: string,
): Promise<{ message: string }> {
  const response = await fetch(`/iot/devices/${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
    headers: normalizeHeaders(headers),
  });

  await handleResponse(response);
  return { message: "Device deleted successfully" };
}
