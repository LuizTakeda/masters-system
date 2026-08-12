import useSWR from "swr";
import { getMe } from "../services/auth.service";

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', getMe);

  if(error){
    console.log(error);
  }

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}