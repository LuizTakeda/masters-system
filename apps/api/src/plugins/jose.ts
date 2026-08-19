import fp from "fastify-plugin";
import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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
  const KEYCLOAK_ISSUER = "https://auth.system.local/realms/iot-dashboard";
  const JWKS_URI = new URL(`${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`);

  const JWKS = createRemoteJWKSet(JWKS_URI);

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const accessToken = request.cookies.access_token;

      if (!accessToken) {
        return reply.unauthorized();
      }

      try {
        const { payload } = await jwtVerify(accessToken, JWKS, {
          issuer: KEYCLOAK_ISSUER,
        });

        request.user = payload as KeycloakUserPayload;
      } catch (err: any) {
        return reply.unauthorized();
      }
    }
  );

  fastify.decorate(
    "authenticateAdmin",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fastify.authenticate(request, reply);

        if (reply.sent) {
          return;
        }

        const roles = request.user?.realm_access?.roles || [];

        if (!roles.includes("system-admin")) {
          return reply.forbidden();
        }

      } catch (err: any) {
        return reply.unauthorized();
      }
    }
  )
});