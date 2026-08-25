import { ResponseMessageSchema } from "@repo/types/commons";
import {
  GetContextFileResponseSchema,
  type UpsertContextFileBodyType,
} from "@repo/types/endpoints/fiware/context-file";
import { apiFetch } from "../../lib/api";

export async function getContextFile(project: string) {
  return await apiFetch(`/api/fiware/context-file/${encodeURIComponent(project)}`, {
    responseSchema: GetContextFileResponseSchema,
  });
}

export async function upsertContextFile(project: string, body: UpsertContextFileBodyType) {
  return await apiFetch(`/api/fiware/context-file/${encodeURIComponent(project)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    responseSchema: ResponseMessageSchema,
  });
}

export async function deleteContextFile(project: string) {
  return await apiFetch(`/api/fiware/context-file/${encodeURIComponent(project)}`, {
    method: "DELETE",
    responseSchema: ResponseMessageSchema,
  });
}

