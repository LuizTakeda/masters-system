import useSWR, { mutate as globalMutate } from "swr";
import type {
  AddClientRoleBodyType,
  CreateClientBodyType,
  GetClientNamesQueryType,
  GetClientsQueryType,
  RemoveClientRoleBodyType,
  SetClientPasswordBodyType,
} from "@repo/types/endpoints/mqtt/client";
import {
  addClientRole as apiAddClientRole,
  createClient as apiCreateClient,
  deleteClient as apiDeleteClient,
  disableClient as apiDisableClient,
  enableClient as apiEnableClient,
  getClient as apiGetClient,
  getClientNames as apiGetClientNames,
  getClients as apiGetClients,
  removeClientRole as apiRemoveClientRole,
  setClientPassword as apiSetClientPassword,
} from "../../services/mqtt/client.service";

export const CLIENTS_BASE_KEY = "/api/mqtt/client";
export const CLIENT_NAMES_BASE_KEY = "/api/mqtt/client/names";

export const getClientsKey = (query?: GetClientsQueryType) =>
  query ? [CLIENTS_BASE_KEY, query.count, query.offset] : CLIENTS_BASE_KEY;

export const getClientNamesKey = (query?: GetClientNamesQueryType) =>
  query ? [CLIENT_NAMES_BASE_KEY, query.count, query.offset] : CLIENT_NAMES_BASE_KEY;

export const getClientKey = (username?: string | null) =>
  username ? [CLIENTS_BASE_KEY, username] : null;

export async function invalidateClients() {
  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(CLIENTS_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(CLIENTS_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true }
  );
}

export function useClients(query?: GetClientsQueryType) {
  const key = getClientsKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetClients(query));

  const create = async (body: CreateClientBodyType) => {
    const res = await apiCreateClient(body);
    await invalidateClients();
    return res;
  };

  const remove = async (username: string) => {
    const res = await apiDeleteClient(username);
    await invalidateClients();
    return res;
  };

  const enable = async (username: string) => {
    const res = await apiEnableClient(username);
    await invalidateClients();
    return res;
  };

  const disable = async (username: string) => {
    const res = await apiDisableClient(username);
    await invalidateClients();
    return res;
  };

  return {
    clients: data?.clients,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
    createClient: create,
    deleteClient: remove,
    enableClient: enable,
    disableClient: disable,
  };
}

export function useClientNames(query?: GetClientNamesQueryType) {
  const key = getClientNamesKey(query);
  const { data, error, isLoading, mutate } = useSWR(key, () => apiGetClientNames(query));

  return {
    clientNames: data?.clients,
    totalCount: data?.totalCount,
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useClient(username?: string | null) {
  const key = getClientKey(username);
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    username ? apiGetClient(username) : null
  );

  const enable = async () => {
    if (!username) throw new Error("Username is required");
    const res = await apiEnableClient(username);
    await invalidateClients();
    return res;
  };

  const disable = async () => {
    if (!username) throw new Error("Username is required");
    const res = await apiDisableClient(username);
    await invalidateClients();
    return res;
  };

  const setPassword = async (body: SetClientPasswordBodyType) => {
    if (!username) throw new Error("Username is required");
    const res = await apiSetClientPassword(username, body);
    await invalidateClients();
    return res;
  };

  const addRole = async (body: AddClientRoleBodyType) => {
    if (!username) throw new Error("Username is required");
    const res = await apiAddClientRole(username, body);
    await invalidateClients();
    return res;
  };

  const removeRole = async (body: RemoveClientRoleBodyType) => {
    if (!username) throw new Error("Username is required");
    const res = await apiRemoveClientRole(username, body);
    await invalidateClients();
    return res;
  };

  const remove = async () => {
    if (!username) throw new Error("Username is required");
    const res = await apiDeleteClient(username);
    await invalidateClients();
    return res;
  };

  return {
    client: data?.client,
    data,
    isLoading,
    isError: error,
    mutate,
    enableClient: enable,
    disableClient: disable,
    setPassword,
    addRole,
    removeRole,
    deleteClient: remove,
  };
}

