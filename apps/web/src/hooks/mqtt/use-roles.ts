import useSWR, { mutate as globalMutate } from "swr";
import type {
  AddRoleAclBodyType,
  CreateRoleBodyType,
  GetRoleNamesQueryType,
  GetRolesQueryType,
  RemoveRoleAclBodyType,
} from "@repo/types/endpoints/mqtt/role";
import {
  addRoleAcl as apiAddRoleAcl,
  createRole as apiCreateRole,
  deleteRole as apiDeleteRole,
  getRole as apiGetRole,
  getRoleNames as apiGetRoleNames,
  getRoles as apiGetRoles,
  removeRoleAcl as apiRemoveRoleAcl,
} from "../../services/mqtt/role.service";

export const ROLES_BASE_KEY = "/api/mqtt/role";
export const ROLE_NAMES_BASE_KEY = "/api/mqtt/role/names";

export const getRolesKey = (query?: GetRolesQueryType) =>
  query ? [ROLES_BASE_KEY, query.count, query.offset] : ROLES_BASE_KEY;

export const getRoleNamesKey = (query?: GetRoleNamesQueryType) =>
  query ? [ROLE_NAMES_BASE_KEY, query.count, query.offset] : ROLE_NAMES_BASE_KEY;

export const getRoleKey = (name?: string | null) =>
  name ? [ROLES_BASE_KEY, name] : null;

export async function invalidateRoles() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(ROLES_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(ROLES_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true }
  );
}

export function useRoles(query?: GetRolesQueryType) {
  const key = getRolesKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetRoles(query));

  const create = async (body: CreateRoleBodyType) => {
    const res = await apiCreateRole(body);
    await invalidateRoles();
    return res;
  };

  const remove = async (name: string) => {
    const res = await apiDeleteRole(name);
    await invalidateRoles();
    return res;
  };

  return {
    roles: data?.roles,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
    createRole: create,
    deleteRole: remove,
  };
}

export function useRoleNames(query?: GetRoleNamesQueryType) {
  const key = getRoleNamesKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetRoleNames(query));

  return {
    roleNames: data?.roles,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRole(name?: string | null) {
  const key = getRoleKey(name);
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    name ? apiGetRole(name) : null
  );

  const addAcl = async (body: AddRoleAclBodyType) => {
    if (!name) throw new Error("Role name is required");
    const res = await apiAddRoleAcl(name, body);
    await invalidateRoles();
    return res;
  };

  const removeAcl = async (body: RemoveRoleAclBodyType) => {
    if (!name) throw new Error("Role name is required");
    const res = await apiRemoveRoleAcl(name, body);
    await invalidateRoles();
    return res;
  };

  const remove = async () => {
    if (!name) throw new Error("Role name is required");
    const res = await apiDeleteRole(name);
    await invalidateRoles();
    return res;
  };

  return {
    role: data?.role,
    data,
    isLoading,
    isError: error,
    mutate,
    addAcl,
    removeAcl,
    deleteRole: remove,
  };
}
