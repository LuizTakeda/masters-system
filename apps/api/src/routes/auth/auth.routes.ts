import { type FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { type FastifyRequest, type FastifyReply } from "fastify";
import { AuthGetQuerySchema, AuthMeGetResponseSchema } from "@repo/types/endpoints/auth";
import z from "zod";
import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  domain: "app.system.local",
  path: "/",
};

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {

  fastify.get(
    "",
    {
      schema: {
        summary: "Starts Keycloak login",
        description: "Initiates the OAuth2 authorization flow by redirecting the user to Keycloak.",
        tags: ["Auth"],
        querystring: AuthGetQuerySchema,
        response: {
          302: z.null().describe("Redirect (Found) to Keycloak login page")
        }
      }
    },
    async (request, reply) => {
      const url = await fastify.keycloakOAuth2.generateAuthorizationUri(request, reply);
      const redirectTo = request.query.redirectTo;

      const allowedOrigins = fastify.config.CORS_ORIGIN;

      reply.clearCookie("redirect_to", {
        domain: "app.system.local",
        path: "/",
      })

      if (redirectTo && allowedOrigins.includes(new URL(redirectTo).origin)) {
        reply.setCookie("redirect_to", redirectTo, {
          ...cookieOptions,
          maxAge: 5 * 60, // 5 min
        });
      }

      return reply.redirect(url);
    });

  fastify.delete(
    "",
    {
      schema: {
        summary: "Logout user",
        description: "Clears the user's access and refresh cookies from the browser.",
        tags: ["Auth"],
        response: {
          200: ResponseMessageSchema,
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refreshToken = request.cookies.refresh_token;

      if (refreshToken) {
        try {
          const tokenObj = fastify.keycloakOAuth2.oauth2.createToken({
            refresh_token: refreshToken
          });

          await tokenObj.revoke('refresh_token');
        } catch (error) {
          request.log.warn(`Falha ao revogar token no Keycloak durante o logout: ${error}`);
        }
      }

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

  fastify.get("/callback", {
    schema: {
      summary: "Keycloak OAuth2 Callback",
      description: "Handles the callback from Keycloak, sets secure cookies, and redirects the user back to the application.",
      tags: ["Auth"],
      response: {
        200: ResponseMessageSchema,
        302: z.null().describe("Redirects to the originally requested URL"),
        401: HttpErrorSchema,
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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

      const redirectTo = request.cookies.redirect_to;

      if (!redirectTo) {
        return reply.status(200).send({ message: "ok" });
      }

      return reply.redirect(redirectTo);

    } catch (err: any) {
      request.log.error(err);
      return reply.unauthorized();
    }
  });

  fastify.get(
    "/refresh",
    {
      schema: {
        summary: "Refresh Access Token",
        description: "Uses the HTTP-only refresh token cookie to obtain a new access token from Keycloak.",
        tags: ["Auth"],
        response: {
          200: ResponseMessageSchema,
          401: HttpErrorSchema,
        }
      }
    },
    async (request, reply) => {
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
    {
      onRequest: [fastify.authenticate],
      schema: {
        summary: "Get Current User",
        description: "Returns the profile information and roles of the currently authenticated user.",
        tags: ["Auth"],
        response: {
          200: AuthMeGetResponseSchema,
          401: HttpErrorSchema,
        }
      }
    },
    async (request, _) => {
      const user = request.user!;

      const response = {
        id: user.sub,
        name: user.name,
        username: user.preferred_username,
        email: user.email,
        roles: user.realm_access?.roles || [],
        groups: user.groups
      };

      return response;
    });
};

export default authRoutes;