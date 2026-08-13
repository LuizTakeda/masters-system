import useSWR from "swr";
import { getMe } from "../services/auth.service";

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR('me', getMe);

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}