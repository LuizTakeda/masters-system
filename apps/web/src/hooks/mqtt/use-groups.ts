import useSWR, { mutate as globalMutate } from "swr";
import type {
  AddGroupClientBodyType,
  AddGroupRoleBodyType,
  CreateGroupBodyType,
  GetGroupNamesQueryType,
  GetGroupsQueryType,
  RemoveGroupClientBodyType,
  RemoveGroupRoleBodyType,
} from "@repo/types/endpoints/mqtt/group";
import {
  addGroupClient as apiAddGroupClient,
  addGroupRole as apiAddGroupRole,
  createGroup as apiCreateGroup,
  deleteGroup as apiDeleteGroup,
  getGroup as apiGetGroup,
  getGroupNames as apiGetGroupNames,
  getGroups as apiGetGroups,
  removeGroupClient as apiRemoveGroupClient,
  removeGroupRole as apiRemoveGroupRole,
} from "../../services/mqtt/group.service";

export const GROUPS_BASE_KEY = "/api/mqtt/group";
export const GROUP_NAMES_BASE_KEY = "/api/mqtt/group/names";

export const getGroupsKey = (query?: GetGroupsQueryType) =>
  query ? [GROUPS_BASE_KEY, query.count, query.offset] : GROUPS_BASE_KEY;

export const getGroupNamesKey = (query?: GetGroupNamesQueryType) =>
  query ? [GROUP_NAMES_BASE_KEY, query.count, query.offset] : GROUP_NAMES_BASE_KEY;

export const getGroupKey = (groupname?: string | null) =>
  groupname ? [GROUPS_BASE_KEY, groupname] : null;

export async function invalidateGroups() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(GROUPS_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(GROUPS_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true }
  );
}

export function useGroups(query?: GetGroupsQueryType) {
  const key = getGroupsKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetGroups(query));

  const create = async (body: CreateGroupBodyType) => {
    const res = await apiCreateGroup(body);
    await invalidateGroups();
    return res;
  };

  const remove = async (groupname: string) => {
    const res = await apiDeleteGroup(groupname);
    await invalidateGroups();
    return res;
  };

  return {
    groups: data?.groups,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
    createGroup: create,
    deleteGroup: remove,
  };
}

export function useGroupNames(query?: GetGroupNamesQueryType) {
  const key = getGroupNamesKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetGroupNames(query));

  return {
    groupNames: data?.groups,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useGroup(groupname?: string | null) {
  const key = getGroupKey(groupname);
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    groupname ? apiGetGroup(groupname) : null
  );

  const addClient = async (body: AddGroupClientBodyType) => {
    if (!groupname) throw new Error("Group name is required");
    const res = await apiAddGroupClient(groupname, body);
    await invalidateGroups();
    return res;
  };

  const removeClient = async (body: RemoveGroupClientBodyType) => {
    if (!groupname) throw new Error("Group name is required");
    const res = await apiRemoveGroupClient(groupname, body);
    await invalidateGroups();
    return res;
  };

  const addRole = async (body: AddGroupRoleBodyType) => {
    if (!groupname) throw new Error("Group name is required");
    const res = await apiAddGroupRole(groupname, body);
    await invalidateGroups();
    return res;
  };

  const removeRole = async (body: RemoveGroupRoleBodyType) => {
    if (!groupname) throw new Error("Group name is required");
    const res = await apiRemoveGroupRole(groupname, body);
    await invalidateGroups();
    return res;
  };

  const remove = async () => {
    if (!groupname) throw new Error("Group name is required");
    const res = await apiDeleteGroup(groupname);
    await invalidateGroups();
    return res;
  };

  return {
    group: data?.group,
    data,
    isLoading,
    isError: error,
    mutate,
    addClient,
    removeClient,
    addRole,
    removeRole,
    deleteGroup: remove,
  };
}

