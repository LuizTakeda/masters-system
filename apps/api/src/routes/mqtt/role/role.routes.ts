import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import { AddRoleAclBodySchema, AddRoleAclParamsSchema, CreateRoleBodySchema, DeleteRoleParamsSchema, GetRoleNamesQuerySchema, GetRoleNamesResponseSchema, GetRoleParamsSchema, GetRoleResponseSchema, GetRolesQuerySchema, GetRolesResponseSchema } from "@repo/types/endpoints/mqtt/role/role";
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
        return reply.internalServerError("Failed to send command");
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
        return reply.internalServerError("Failed to send command");
      }

      return response?.data
    });

  fastify.get("/:name",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Retrieves a specific MQTT role",
        description: "Fetches the detailed configuration and Access Control Lists (ACLs) of a specific MQTT role by its name from Mosquitto's Dynamic Security. Returns a 404 if the role does not exist. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        params: GetRoleParamsSchema,
        response: {
          200: GetRoleResponseSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params } = request;

      const [response] = (await fastify.mqtt.dynsec.getRole({ rolename: params.name })).responses;

      if (response?.error) {

        if (response.error === "Role not found") {
          return reply.notFound("Role not found");
        }

        return reply.internalServerError("Failed to send command");
      }

      return response?.data
    })

  fastify.post("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Creates a new MQTT role",
        description: "Creates a new role in Mosquitto's Dynamic Security configuration. Accepts an optional text name, description, and an initial set of Access Control Lists (ACLs). Returns a 409 Conflict if a role with the same name already exists. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        body: CreateRoleBodySchema,
        response: {
          200: ResponseMessageSchema,
          409: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { body } = request;

      if (body.rolename == "names") {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword and cannot be used as a role name.")
      }

      const [response] = (await fastify.mqtt.dynsec.createRole({
        rolename: body.rolename,
        textname: body.textname,
        textdescription: body.textdescription,
        acls: body.acls,
      })).responses;

      if (response?.error) {

        if (response.error === "Role already exists") {
          return reply.conflict("Role already exists");
        }

        return reply.internalServerError("Failed to send command");
      }


      return { message: "Role created" };
    }
  )

  fastify.delete("/:name",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Deletes a specific MQTT role",
        description: "Permanently removes a role from Mosquitto's Dynamic Security configuration by its name. Returns a 404 if the role does not exist and a 422 if attempting to use a reserved system keyword. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        params: DeleteRoleParamsSchema,
        response: {
          200: ResponseMessageSchema,
          403: HttpErrorSchema,
          404: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (params.name == "names") {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword and cannot be used as a role name.")
      }

      if (params.name === "admin") {
        return reply.forbidden("System roles cannot be deleted.")
      }

      const [response] = (await fastify.mqtt.dynsec.deleteRole({
        rolename: params.name
      })).responses;

      if (response?.error) {

        if (response.error === "Role not found") {
          return reply.notFound("Role not found");
        }

        return reply.internalServerError("Failed to send command");
      }

      return { message: "Role deleted" };
    }
  )

  fastify.post("/:name/acls",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Adds an ACL rule to an MQTT role",
        description: "Appends a new Access Control List (ACL) rule to an existing MQTT role in Mosquitto's Dynamic Security. Returns a 404 if the specified role does not exist, and a 409 Conflict if an ACL for the exact topic already exists. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        params: AddRoleAclParamsSchema,
        body: AddRoleAclBodySchema,
        response: {
          200: ResponseMessageSchema,
          404: HttpErrorSchema,
          409: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params, body } = request;

      const [response] = (await fastify.mqtt.dynsec.addRoleACL({
        rolename: params.name,
        acltype: body.acltype,
        topic: body.topic,
        priority: body.priority,
        allow: body.allow
      })).responses;

      if (response?.error) {
        if (response.error === "Role not found") {
          return reply.notFound(`Role '${params.name}' not found.`);
        }

        if (response.error === "ACL with this topic already exists") {
          return reply.conflict("ACL with this topic already exists");
        }

        return reply.internalServerError("Failed to process command in Mosquitto");
      }

      return { message: "ACL added" };
    }
  );
}

export default rolesRoutes;