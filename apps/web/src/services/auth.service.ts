import { AuthMeGetResponseSchema } from "@repo/types/endpoints/auth";
import { apiFetch } from "../lib/api";

export async function getMe() {
  return await apiFetch("/api/auth/me", { responseSchema: AuthMeGetResponseSchema });
}
