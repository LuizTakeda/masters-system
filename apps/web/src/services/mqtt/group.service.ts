import { ResponseMessageSchema } from "@repo/types/commons";
import {
  type AddGroupClientBodyType,
  type AddGroupRoleBodyType,
  type CreateGroupBodyType,
  type GetGroupNamesQueryType,
  GetGroupNamesResponseSchema,
  GetGroupResponseSchema,
  type GetGroupsQueryType,
  GetGroupsResponseSchema,
  type RemoveGroupClientBodyType,
  type RemoveGroupRoleBodyType,
} from "@repo/types/endpoints/mqtt/group";
import { apiFetch } from "../../lib/api";

export async function getGroups(query?: GetGroupsQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/group?${queryString}` : "/api/mqtt/group";

  return await apiFetch(url, {
    responseSchema: GetGroupsResponseSchema,
  });
}

export async function getGroupNames(query?: GetGroupNamesQueryType) {
  const searchParams = new URLSearchParams();

  if (query?.count !== undefined) {
    searchParams.set("count", String(query.count));
  }
  if (query?.offset !== undefined) {
    searchParams.set("offset", String(query.offset));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mqtt/group/names?${queryString}` : "/api/mqtt/group/names";

  return await apiFetch(url, {
    responseSchema: GetGroupNamesResponseSchema,
  });
}

export async function getGroup(groupname: string) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}`, {
    responseSchema: GetGroupResponseSchema,
  });
}

export async function createGroup(body: CreateGroupBodyType) {
  return await apiFetch("/api/mqtt/group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function deleteGroup(groupname: string) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}`, {
    method: "DELETE",
    responseSchema: ResponseMessageSchema,
  });
}

export async function addGroupClient(groupname: string, body: AddGroupClientBodyType) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function removeGroupClient(groupname: string, body: RemoveGroupClientBodyType) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}/clients`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function addGroupRole(groupname: string, body: AddGroupRoleBodyType) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function removeGroupRole(groupname: string, body: RemoveGroupRoleBodyType) {
  return await apiFetch(`/api/mqtt/group/${encodeURIComponent(groupname)}/roles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

