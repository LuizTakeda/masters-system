import { ResponseMessageSchema } from "@repo/types/commons";
import {
  GetContextFileResponseSchema,
  type UpsertContextFileBodyType,
} from "@repo/types/endpoints/fiware/context-file";
import { apiFetch } from "../../lib/api";

export async function getContextFile() {
  return await apiFetch("/api/fiware/context-file", {
    responseSchema: GetContextFileResponseSchema,
  });
}

export async function upsertContextFile(body: UpsertContextFileBodyType) {
  return await apiFetch("/api/fiware/context-file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function deleteContextFile() {
  return await apiFetch("/api/fiware/context-file", {
    method: "DELETE",
    responseSchema: ResponseMessageSchema,
  });
}
