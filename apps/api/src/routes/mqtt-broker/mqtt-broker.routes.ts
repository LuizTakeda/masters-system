import type { FastifyReply } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

// TODO
// Get Credential list
// Get credentials role and permissons
// Create Credentials
// ASsing role to a credential

// Get Roles
// Get roles permissons and credentials that use this the role
// Create Role
// Create permissions

const mqttBrokerRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const runSigleCommand = async (commandPayload: any, reply: FastifyReply) => {
    try {
      const response = await fastify.mqttSendCommand({ commands: [commandPayload] });

      const result = response.responses[0];

      if (result.error && result.error !== "success") {
        return reply.status(400).send({ error: result.error });
      }

      return reply.send(result.data || { success: true });
    } catch (error) {
      return reply.internalServerError();
    }
  };

  fastify.get("/credential",
    {
      onRequest: [fastify.authenticateAdmin]
    },
    async (request, reply) => {
      try {
        const { responses } = await fastify.mqttSendCommand({
          commands: [{ command: "listClients" }]
        });

        if (!responses) {
          return reply.internalServerError();
        }

        const { data } = responses.at(0);

        return reply.send(data);

      } catch (error) {
        fastify.log.error(error);
        return reply.internalServerError();
      }
    });
}

export default mqttBrokerRoutes;