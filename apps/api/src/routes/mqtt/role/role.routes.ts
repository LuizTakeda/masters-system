import { GetRolesQuerySchema } from "@repo/types/endpoints/mqtt/role/role";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const rolesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("", {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      tags: ["MQTT, Roles"],
      security: [{ bearerAuth: [] }],
      querystring: GetRolesQuerySchema
    },
  }, async (request, reply) => {
    return await fastify.mqttSendCommands({
      commands: [
        {
          command: "listRoles",
          verbose: true,
          count: -1,
          offset: 0
        }
      ]
    })
  });
}

export default rolesRoutes;