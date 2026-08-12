import { AuthMeGetResponseSchema, type AuthMeGetResponseType } from "@repo/types/endpoints/auth"
import {  } from "react-router";

export async function getMe(): Promise<AuthMeGetResponseType | null> {
  const response = await fetch("/api/auth/me");

  if (response.status === 401) {
      console.warn("Token inválido. Redirecionando...");
      window.location.href = '/api/auth'; 
      return null; // Interrompe a execução para não dar erro no .json()
    }

  if (!response.ok) {
    throw Error("eesponse not ok") // Placeholder dps implementar outro padronizado
  }

  try {
    const rawData = await response.json() as AuthMeGetResponseType

    const parsedResult = AuthMeGetResponseSchema.safeParse(rawData);

    if (!parsedResult.success) {
      throw Error("fail to parse") // Placeholder dps implementar outro padronizado
    }

    return parsedResult.data;
  } catch {
    throw Error("internal error") // Placeholder dps implementar outro padronizado
  }
}
