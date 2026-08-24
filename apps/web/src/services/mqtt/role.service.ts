import { ResponseMessageSchema } from "@repo/types/commons";
import {
  type AddRoleAclBodyType,
  type CreateRoleBodyType,
  type GetRoleNamesQueryType,
  GetRoleNamesResponseSchema,
  GetRoleResponseSchema,
  type GetRolesQueryType,
  GetRolesResponseSchema,
  type RemoveRoleAclBodyType,
} from "@repo/types/endpoints/mqtt/role";
import { apiFetch } from "../../lib/api";

export async function getRoles(query?: GetRolesQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/role?${queryString}` : "/api/mqtt/role";

  return await apiFetch(url, {
    responseSchema: GetRolesResponseSchema,
  });
}

export async function getRoleNames(query?: GetRoleNamesQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/role/names?${queryString}` : "/api/mqtt/role/names";

  return await apiFetch(url, {
    responseSchema: GetRoleNamesResponseSchema,
  });
}

export async function getRole(name: string) {
  return await apiFetch(`/api/mqtt/role/${encodeURIComponent(name)}`, {
    responseSchema: GetRoleResponseSchema,
  });
}

export async function createRole(body: CreateRoleBodyType) {
  return await apiFetch("/api/mqtt/role", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function deleteRole(name: string) {
  return await apiFetch(`/api/mqtt/role/${encodeURIComponent(name)}`, {
    method: "DELETE",
    responseSchema: ResponseMessageSchema,
  });
}

export async function addRoleAcl(name: string, body: AddRoleAclBodyType) {
  return await apiFetch(`/api/mqtt/role/${encodeURIComponent(name)}/acls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function removeRoleAcl(name: string, body: RemoveRoleAclBodyType) {
  return await apiFetch(`/api/mqtt/role/${encodeURIComponent(name)}/acls`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

