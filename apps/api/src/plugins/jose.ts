import fp from "fastify-plugin";
import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Extendendo as tipagens do Fastify para incluir nosso decorator
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: KeycloakUserPayload;
  }
}

export interface KeycloakUserPayload extends JWTPayload {
  sub: string;
  name: string;
  preferred_username: string;
  email: string;
  realm_access?: {
    roles: string[];
  };
  groups: string[];
}

export default fp(async (fastify: FastifyInstance) => {
  // 1. Configuração estrita do JWKS (sempre apontando fixo para o seu Keycloak)
  const KEYCLOAK_ISSUER = "https://auth.system.local/realms/iot-dashboard";
  const JWKS_URI = new URL(`${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`);

  // O createRemoteJWKSet faz o cache automático das chaves públicas
  const JWKS = createRemoteJWKSet(JWKS_URI);

  // 2. Decorator de Autenticação (Middleware)
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const accessToken = request.cookies.access_token;

      if (!accessToken) {
        return reply.status(401).send({ error: "Não autorizado. Token não encontrado." });
      }

      try {
        // Validação estrita: Assinatura + Expiração + Emissor Fixo (iss)
        const { payload } = await jwtVerify(accessToken, JWKS, {
          issuer: KEYCLOAK_ISSUER,
        });

        // Anexa o payload decodificado e validado na requisição
        request.user = payload as KeycloakUserPayload;
      } catch (err: any) {
        request.log.warn(`Tentativa de acesso com JWT inválido: ${err.message}`);

        if (err.code === "ERR_JWT_EXPIRED") {
          return reply.status(401).send({ error: "Sessão expirada. Faça login novamente." });
        }

        return reply.status(401).send({ error: "Token inválido ou não confiável." });
      }
    }
  );
});