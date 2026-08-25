import useSWR, { mutate as globalMutate } from "swr";
import type { UpsertContextFileBodyType } from "@repo/types/endpoints/fiware/context-file";
import {
  deleteContextFile as apiDeleteContextFile,
  getContextFile as apiGetContextFile,
  upsertContextFile as apiUpsertContextFile,
} from "../../services/fiware/context-file.service";

export const CONTEXT_FILE_BASE_KEY = "/api/fiware/context-file";

export const getContextFileKey = (project?: string | null) =>
  project ? [CONTEXT_FILE_BASE_KEY, project] : null;

export async function invalidateContextFile(project?: string) {
  if (project) {
    return await globalMutate(getContextFileKey(project), undefined, { revalidate: true });
  }

  return await globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(CONTEXT_FILE_BASE_KEY);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(CONTEXT_FILE_BASE_KEY);
      }
      return false;
    },
    undefined,
    { revalidate: true }
  );
}

export function useContextFile(project?: string | null) {
  const key = getContextFileKey(project);
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    project ? apiGetContextFile(project) : null
  );

  const save = async (body: UpsertContextFileBodyType) => {
    if (!project) throw new Error("Project parameter is required");
    const res = await apiUpsertContextFile(project, body);
    await invalidateContextFile(project);
    return res;
  };

  const remove = async () => {
    if (!project) throw new Error("Project parameter is required");
    const res = await apiDeleteContextFile(project);
    await invalidateContextFile(project);
    return res;
  };

  return {
    contextFile: data,
    data,
    isLoading,
    isError: error,
    mutate,
    upsertContextFile: save,
    deleteContextFile: remove,
  };
}

