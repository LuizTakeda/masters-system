import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import {
  AddRoleAclBodySchema, AddRoleAclParamsSchema, CreateRoleBodySchema,
  DeleteRoleParamsSchema, GetRoleNamesQuerySchema, GetRoleNamesResponseSchema,
  GetRoleParamsSchema, GetRoleResponseSchema, GetRolesQuerySchema,
  GetRolesResponseSchema, RemoveRoleAclBodySchema, RemoveRoleAclParamsSchema
} from "@repo/types/endpoints/mqtt/role/role";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const SYSTEM_ROLES = [
  "admin",
  "broker-admin",
  "client",
  "dynsec-admin",
  "super-admin",
  "sys-notify",
  "sys-observe",
  "topic-observe"
];

const rolesRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // ==========================================
  // GET / (List Roles)
  // ==========================================
  fastify.get("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Lists MQTT broker roles",
        description: "Retrieves a paginated list of all roles configured in Mosquitto's Dynamic Security. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        querystring: GetRolesQuerySchema,
        response: { 200: GetRolesResponseSchema, 500: HttpErrorSchema },
      },
    }, async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listRolesVerbose({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch roles");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    });

  // ==========================================
  // GET /names (List Role Names)
  // ==========================================
  fastify.get("/names",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Lists MQTT role names",
        description: "Retrieves a paginated list of role names.",
        security: [{ bearerAuth: [] }],
        querystring: GetRoleNamesQuerySchema,
        response: { 200: GetRoleNamesResponseSchema, 500: HttpErrorSchema },
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listRoles({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch role names");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    });

  // ==========================================
  // GET /:name (Get Specific Role)
  // ==========================================
  fastify.get("/:name",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Retrieves a specific MQTT role",
        description: "Fetches detailed configuration of a specific MQTT role.",
        security: [{ bearerAuth: [] }],
        params: GetRoleParamsSchema,
        response: { 200: GetRoleResponseSchema, 404: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.getRole({ rolename: request.params.name })).responses;

        if (response?.error) {
          if (response.error === "Role not found") {
            return reply.notFound("Role not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch role");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    });

  // ==========================================
  // POST / (Create Role)
  // ==========================================
  fastify.post("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Creates a new MQTT role",
        description: "Creates a new role in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        body: CreateRoleBodySchema,
        response: { 200: ResponseMessageSchema, 409: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { body } = request;

      if (body.rolename === "names") {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_ROLES.includes(body.rolename)) {
        return reply.conflict("Cannot create a role with a reserved system name.");
      }

      try {
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

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to create role");
        }

        return { message: "Role created" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:name (Delete Role)
  // ==========================================
  fastify.delete("/:name",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Deletes a specific MQTT role",
        security: [{ bearerAuth: [] }],
        params: DeleteRoleParamsSchema,
        response: { 200: ResponseMessageSchema, 403: HttpErrorSchema, 404: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (params.name === "names") {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_ROLES.includes(params.name)) {
        return reply.forbidden(`The role '${params.name}' is a system role and cannot be deleted.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.deleteRole({ rolename: params.name })).responses;

        if (response?.error) {
          if (response.error === "Role not found") {
            return reply.notFound("Role not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to delete role");
        }

        return { message: "Role deleted" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:name/acls (Add ACL)
  // ==========================================
  fastify.post("/:name/acls",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Adds an ACL rule to an MQTT role",
        security: [{ bearerAuth: [] }],
        params: AddRoleAclParamsSchema,
        body: AddRoleAclBodySchema,
        response: { 200: ResponseMessageSchema, 403: HttpErrorSchema, 404: HttpErrorSchema, 409: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params, body } = request;

      if (SYSTEM_ROLES.includes(params.name)) {
        return reply.forbidden(`System roles like '${params.name}' cannot be modified directly.`);
      }

      try {
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

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to add ACL");
        }

        return { message: "ACL added" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:name/acls (Remove ACL)
  // ==========================================
  fastify.delete("/:name/acls",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Roles", "MQTT"],
        summary: "Removes an ACL rule from an MQTT role",
        security: [{ bearerAuth: [] }],
        params: RemoveRoleAclParamsSchema,
        body: RemoveRoleAclBodySchema,
        response: { 200: ResponseMessageSchema, 403: HttpErrorSchema, 404: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params, body } = request;

      if (SYSTEM_ROLES.includes(params.name)) {
        return reply.forbidden(`System roles like '${params.name}' cannot be modified directly.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.removeRoleACL({
          rolename: params.name,
          acltype: body.acltype,
          topic: body.topic
        })).responses;

        if (response?.error) {
          if (response.error === "Role not found") {
            return reply.notFound(`Role '${params.name}' not found.`);
          }

          if (response.error === "ACL not found" || response.error === "ACL does not exist") {
            return reply.notFound("This ACL rule was not found in the role.");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to remove ACL");
        }

        return { message: "ACL removed successfully" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );
}

export default rolesRoutes;