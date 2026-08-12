import { type FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { type FastifyRequest, type FastifyReply } from "fastify";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  domain: "app.system.local",
  path: "/",
};

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {

  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const url = await fastify.keycloakOAuth2.generateAuthorizationUri(request, reply);
    return reply.redirect(url);
  });

  fastify.delete("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie("access_token", {
      domain: "app.system.local",
      path: "/",
    });

    reply.clearCookie("refresh_token", {
      domain: "app.system.local",
      path: "/",
    });

    return { message: "ok" };
  });

  fastify.get("/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await fastify.keycloakOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      reply.setCookie("access_token", token.token.access_token as string, {
        ...cookieOptions,
        maxAge: (token.token.expires_in as number) || 15 * 60, // 15 min
      });

      if (token.token.refresh_token) {
        reply.setCookie("refresh_token", token.token.refresh_token as string, {
          ...cookieOptions,
          maxAge: 1 * 24 * 60 * 60, // 1 day
        });
      }

      return reply.status(200).send({ message: "ok" });

    } catch (err: any) {
      request.log.error(err);
      return reply.unauthorized();
    }
  });

  fastify.get("/refresh", async (request, reply) => {
    try {
      const refreshToken = request.cookies.refresh_token;

      if (!refreshToken) {
        return reply.unauthorized();
      }

      const tokenObj = await fastify.keycloakOAuth2.oauth2.createToken({
        refresh_token: refreshToken
      }).refresh();

      reply.setCookie("access_token", tokenObj.token.access_token as string, {
        ...cookieOptions,
        maxAge: tokenObj.token.expires_in as number,
      })

      if (tokenObj.token.refresh_token) {
        reply.setCookie("refresh_token", tokenObj.token.refresh_token as string, {
          ...cookieOptions,
          maxAge: (tokenObj.token as any).refresh_expires_in || 1 * 24 * 60 * 60,
        });
      }

      return { message: "ok" };
    } catch (error) {
      request.log.error(error);
      return reply.unauthorized();
    }
  });

  fastify.get(
    "/me",
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;

      return {
        id: user.sub,
        name: user.name,
        username: user.preferred_username,
        email: user.email,
        roles: user.realm_access?.roles || [],
        groups: user.groups
      };
    });
};

export default authRoutes;