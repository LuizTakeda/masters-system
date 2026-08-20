import { HttpErrorSchema } from "@repo/types/commons";
import { GetRoleNamesQuerySchema, GetRoleNamesResponseSchema, GetRolesQuerySchema, GetRolesResponseSchema } from "@repo/types/endpoints/mqtt/role/role";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const rolesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Lists MQTT broker roles",
        description: "Retrieves a paginated list of all roles configured in Mosquitto's Dynamic Security. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        querystring: GetRolesQuerySchema,
        response: {
          200: GetRolesResponseSchema,
          500: HttpErrorSchema
        },
      },
    }, async (request, reply) => {
      const { query } = request;

      const [response] = (await fastify.mqtt.dynsec.listRolesVerbose(
        {
          count: query.count,
          offset: query.offset
        })).responses;

      if (response?.error) {
        return reply.internalServerError("Fail to send command");
      }

      return response?.data
    });

  fastify.get("/names",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Lists MQTT role names",
        description: "Retrieves a paginated list of role names configured in Mosquitto's Dynamic Security. Unlike the detailed list, this endpoint returns only the role identifiers. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        querystring: GetRoleNamesQuerySchema,
        response: {
          200: GetRoleNamesResponseSchema,
          500: HttpErrorSchema
        },
      }
    },
    async (request, reply) => {
      const { query } = request;

      const [response] = (await fastify.mqtt.dynsec.listRoles(
        {
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