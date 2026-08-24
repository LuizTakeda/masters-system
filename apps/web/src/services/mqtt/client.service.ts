import { ResponseMessageSchema } from "@repo/types/commons";
import {
  type AddClientRoleBodyType,
  type CreateClientBodyType,
  type GetClientNamesQueryType,
  GetClientNamesResponseSchema,
  GetClientResponseSchema,
  type GetClientsQueryType,
  GetClientsResponseSchema,
  type RemoveClientRoleBodyType,
  type SetClientPasswordBodyType,
} from "@repo/types/endpoints/mqtt/client";
import { apiFetch } from "../../lib/api";

export async function getClients(query?: GetClientsQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/client?${queryString}` : "/api/mqtt/client";

  return await apiFetch(url, {
    responseSchema: GetClientsResponseSchema,
  });
}

export async function getClientNames(query?: GetClientNamesQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/client/names?${queryString}` : "/api/mqtt/client/names";

  return await apiFetch(url, {
    responseSchema: GetClientNamesResponseSchema,
  });
}

export async function getClient(username: string) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}`, {
    responseSchema: GetClientResponseSchema,
  });
}

export async function createClient(body: CreateClientBodyType) {
  return await apiFetch("/api/mqtt/client", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function deleteClient(username: string) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}`, {
    method: "DELETE",
    responseSchema: ResponseMessageSchema,
  });
}

export async function enableClient(username: string) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}/enable`, {
    method: "POST",
    responseSchema: ResponseMessageSchema,
  });
}

export async function disableClient(username: string) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}/disable`, {
    method: "POST",
    responseSchema: ResponseMessageSchema,
  });
}

export async function setClientPassword(username: string, body: SetClientPasswordBodyType) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function addClientRole(username: string, body: AddClientRoleBodyType) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function removeClientRole(username: string, body: RemoveClientRoleBodyType) {
  return await apiFetch(`/api/mqtt/client/${encodeURIComponent(username)}/roles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

