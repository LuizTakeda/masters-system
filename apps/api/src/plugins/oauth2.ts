import fp from "fastify-plugin"
import fastifyCookie from "@fastify/cookie";
import fastifyOAuth2 from "@fastify/oauth2";
import { AuthorizationCode } from "simple-oauth2"

import { type OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    keycloakOAuth2: OAuth2Namespace & { oauth2: AuthorizationCode };
  }
}

export default fp(async (fastify) => {
  await fastify.register(fastifyCookie);

  await fastify.register(fastifyOAuth2, {
    name: "keycloakOAuth2",

    credentials: {
      client: {
        id: fastify.config.KEYCLOAK_CLIENT_ID,
        secret: fastify.config.KEYCLOAK_CLIENT_SECRET,
      },
    },

    discovery: {
      issuer: `https://auth.system.local/realms/${fastify.config.KEYCLOAK_REALM}`,
    },

    callbackUri: "https://app.system.local/api/auth/callback",
    scope: ["openid", "profile", "email"],

    cookie: {
      secure: true,
      sameSite: "lax",
      path: "/",
    },
  });
});