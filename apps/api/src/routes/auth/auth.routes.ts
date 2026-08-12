import { type FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { type FastifyRequest, type FastifyReply } from "fastify";

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {

  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const url = await fastify.keycloakOAuth2.generateAuthorizationUri(request, reply);
    return reply.redirect(url);
  });

  fastify.get("/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await fastify.keycloakOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      reply.setCookie("access_token", token.token.access_token as string, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        domain: "app.system.local",
        path: "/",
        maxAge: 15 * 60,     // 15 minutos
      });

      return reply.redirect("https://app.system.local/dashboard");
    } catch (err: any) {
      request.log.error(err);

      return reply.status(400).send({
        error: "Falha na autenticação",
        message: err.message
      });
    }
  });

  // 3. Rota de perfil do usuário logado
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

  // 4. Rota de Logout
  fastify.delete("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie("access_token", {
      domain: "app.system.local",
      path: "/",
    });

    return { message: "Logout efetuado com sucesso" };
  });
};

export default authRoutes;