import type { HttpErrorType } from "@repo/types/commons";
import {
  type CreateServiceItemType,
  type CreateServicesBodyType,
  type DeleteServiceQueryType,
  type GetServicesQueryType,
  GetServicesResponseSchema,
  type GetServicesResponseType,
  type IotAgentHeadersType,
  type UpdateServiceBodyType,
  type UpdateServiceQueryType,
} from "@repo/types/endpoints/iot-agent/service.endpoints";

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
// Services Endpoints
//**************************************************

/**
 * Retrieve all service groups under the given tenant/subservice.
 * GET /iot/services
 */
export async function getServices(
  headers: IotHeadersInput,
  query?: GetServicesQueryType,
): Promise<GetServicesResponseType> {
  const searchParams = new URLSearchParams();

  if (query?.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }
  if (query?.resource) {
    searchParams.set("resource", query.resource);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/iot/services?${queryString}` : "/iot/services";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...normalizeHeaders(headers),
      Accept: "application/json",
    },
  });

  return handleResponse<GetServicesResponseType>(response, (data) =>
    GetServicesResponseSchema.safeParse(data),
  );
}

/**
 * Provision one or multiple service groups.
 * POST /iot/services
 */
export async function createServices(
  headers: IotHeadersInput,
  body: CreateServicesBodyType,
): Promise<{ message: string }> {
  const response = await fetch("/iot/services", {
    method: "POST",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response);
  return { message: "Services provisioned successfully" };
}

/**
 * Convenience helper to provision a single service group.
 * POST /iot/services
 */
export async function createService(
  headers: IotHeadersInput,
  service: CreateServiceItemType,
): Promise<{ message: string }> {
  return createServices(headers, { services: [service] });
}

/**
 * Update an existing service group.
 * PUT /iot/services?resource=...&apikey=...
 */
export async function updateService(
  headers: IotHeadersInput,
  query: UpdateServiceQueryType,
  body: UpdateServiceBodyType,
): Promise<{ message: string }> {
  const searchParams = new URLSearchParams();
  searchParams.set("resource", query.resource);
  if (query.apikey) {
    searchParams.set("apikey", query.apikey);
  }

  const response = await fetch(`/iot/services?${searchParams.toString()}`, {
    method: "PUT",
    headers: {
      ...normalizeHeaders(headers),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response);
  return { message: "Service updated successfully" };
}

/**
 * Delete a service group (and optionally all devices associated with it).
 * DELETE /iot/services?resource=...&apikey=...&device=...
 */
export async function deleteService(
  headers: IotHeadersInput,
  query: DeleteServiceQueryType,
): Promise<{ message: string }> {
  const searchParams = new URLSearchParams();
  searchParams.set("resource", query.resource);
  if (query.apikey) {
    searchParams.set("apikey", query.apikey);
  }
  if (query.device !== undefined) {
    searchParams.set("device", String(query.device));
  }

  const response = await fetch(`/iot/services?${searchParams.toString()}`, {
    method: "DELETE",
    headers: normalizeHeaders(headers),
  });

  await handleResponse(response);
  return { message: "Service deleted successfully" };
}
