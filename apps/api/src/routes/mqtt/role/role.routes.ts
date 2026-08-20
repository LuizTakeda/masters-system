import { HttpErrorSchema } from "@repo/types/commons";
import { GetRolesQuerySchema, GetRolesResponseSchema } from "@repo/types/endpoints/mqtt/role/role";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const rolesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("", {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      summary: "Lists MQTT broker roles",
      description: "Retrieves a paginated list of all roles configured in Mosquitto's Dynamic Security. Requires administrator privileges.",
      tags: ["MQTT Roles", "MQTT"],
      security: [{ bearerAuth: [] }],
      querystring: GetRolesQuerySchema,
      response: {
        200: GetRolesResponseSchema,
        500: HttpErrorSchema
      },
    },
  }, async (request, reply) => {
    const { query } = request;

    const [response] = (await fastify.mqtt.dynsec.listRoles(
      {
        verbose: true,
        count: query.count,
        offset: query.offset
      })).responses;

    if (response?.error) {
      return reply.internalServerError("Fail to send command");
    }

    return response?.data
  });
}

export default rolesRoutes;