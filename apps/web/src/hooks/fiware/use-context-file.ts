import useSWR, { mutate as globalMutate } from "swr";
import type { UpsertContextFileBodyType } from "@repo/types/endpoints/fiware/context-file";
import {
  deleteContextFile as apiDeleteContextFile,
  getContextFile as apiGetContextFile,
  upsertContextFile as apiUpsertContextFile,
} from "../../services/fiware/context-file.service";

export const CONTEXT_FILE_KEY = "/api/fiware/context-file";

export async function invalidateContextFile() {
  return await globalMutate(CONTEXT_FILE_KEY, undefined, { revalidate: true });
}

export function useContextFile() {
  const { data, error, isLoading, mutate } = useSWR(
    CONTEXT_FILE_KEY,
    apiGetContextFile,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const save = async (body: UpsertContextFileBodyType) => {
    const res = await apiUpsertContextFile(body);
    await invalidateContextFile();
    return res;
  };

  const remove = async () => {
    const res = await apiDeleteContextFile();
    await invalidateContextFile();
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
