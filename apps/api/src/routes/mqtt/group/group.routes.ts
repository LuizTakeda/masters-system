import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import {
  AddGroupClientBodySchema,
  AddGroupClientParamsSchema,
  AddGroupRoleBodySchema,
  AddGroupRoleParamsSchema,
  CreateGroupBodySchema,
  DeleteGroupParamsSchema,
  GetGroupNamesQuerySchema,
  GetGroupNamesResponseSchema,
  GetGroupParamsSchema,
  GetGroupResponseSchema,
  GetGroupsQuerySchema,
  GetGroupsResponseSchema,
  RemoveGroupClientBodySchema,
  RemoveGroupClientParamsSchema,
  RemoveGroupRoleBodySchema,
  RemoveGroupRoleParamsSchema
} from "@repo/types/endpoints/mqtt/group";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const SYSTEM_GROUPS = [
  "admin",
];

const INVALID_GROUP_NAME = [
  "names"
];

const groupRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // ==========================================
  // GET / (List Groups Verbose)
  // ==========================================
  fastify.get("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Lists MQTT groups with details",
        description: "Retrieves a paginated list of all groups configured in Mosquitto's Dynamic Security. Requires administrator privileges.",
        security: [{ bearerAuth: [] }],
        querystring: GetGroupsQuerySchema,
        response: {
          200: GetGroupsResponseSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listGroupsVerbose({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch groups");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // GET /names (List Group Names)
  // ==========================================
  fastify.get("/names",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Lists MQTT group names",
        description: "Retrieves a paginated list of group names.",
        security: [{ bearerAuth: [] }],
        querystring: GetGroupNamesQuerySchema,
        response: {
          200: GetGroupNamesResponseSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listGroups({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch group names");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // GET /:groupname (Get Group)
  // ==========================================
  fastify.get("/:groupname",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Retrieves a specific MQTT group",
        description: "Fetches detailed configuration of a specific MQTT group.",
        security: [{ bearerAuth: [] }],
        params: GetGroupParamsSchema,
        response: {
          200: GetGroupResponseSchema,
          404: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.getGroup({
          groupname: params.groupname
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to fetch group");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST / (Create Group)
  // ==========================================
  fastify.post("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Creates a new MQTT group",
        description: "Creates a new group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        body: CreateGroupBodySchema,
        response: {
          200: ResponseMessageSchema,
          404: HttpErrorSchema,
          409: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { body } = request;

      if (INVALID_GROUP_NAME.includes(body.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(body.groupname)) {
        return reply.conflict("Cannot create a group with a reserved system name.");
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.createGroup({
          groupname: body.groupname,
          roles: body.roles
        })).responses;

        if (response?.error) {
          if (response.error === "Group already exists") {
            return reply.conflict("Group already exists");
          }

          if (response.error === "Role not found") {
            return reply.notFound("Role not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to create group");
        }

        return { message: "Group created" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:groupname (Delete Group)
  // ==========================================
  fastify.delete("/:groupname",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Deletes a specific MQTT group",
        description: "Deletes a specific group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: DeleteGroupParamsSchema,
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

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(params.groupname)) {
        return reply.forbidden(`The group '${params.groupname}' is a system group and cannot be deleted.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.deleteGroup({
          groupname: params.groupname
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to delete group");
        }

        return { message: "Group deleted" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:groupname/clients (Add Group Client)
  // ==========================================
  fastify.post("/:groupname/clients",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Adds a client to a group",
        description: "Adds a client to a specific group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: AddGroupClientParamsSchema,
        body: AddGroupClientBodySchema,
        response: {
          200: ResponseMessageSchema,
          403: HttpErrorSchema,
          404: HttpErrorSchema,
          409: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params, body } = request;

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(params.groupname)) {
        return reply.forbidden(`System group '${params.groupname}' clients cannot be modified directly.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.addGroupClient({
          groupname: params.groupname,
          username: body.username,
          priority: body.priority
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          if (response.error === "Client not found") {
            return reply.notFound("Client not found");
          }

          if (response.error === "Client is already in this group" || response.error === "Client already in group") {
            return reply.conflict("Client is already in this group");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to add client to group");
        }

        return { message: "Client added to group" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:groupname/clients (Remove Group Client)
  // ==========================================
  fastify.delete("/:groupname/clients",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Removes a client from a group",
        description: "Removes a client from a specific group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: RemoveGroupClientParamsSchema,
        body: RemoveGroupClientBodySchema,
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
      const { params, body } = request;

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(params.groupname)) {
        return reply.forbidden(`System group '${params.groupname}' clients cannot be modified directly.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.removeGroupClient({
          groupname: params.groupname,
          username: body.username
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          if (response.error === "Client not found" || response.error === "Client not in group" || response.error === "Client is not in group") {
            return reply.notFound(response.error);
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to remove client from group");
        }

        return { message: "Client removed from group" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:groupname/roles (Add Group Role)
  // ==========================================
  fastify.post("/:groupname/roles",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Adds a role to a group",
        description: "Adds a role to a specific group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: AddGroupRoleParamsSchema,
        body: AddGroupRoleBodySchema,
        response: {
          200: ResponseMessageSchema,
          403: HttpErrorSchema,
          404: HttpErrorSchema,
          409: HttpErrorSchema,
          422: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      const { params, body } = request;

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(params.groupname)) {
        return reply.forbidden(`System group '${params.groupname}' roles cannot be modified directly.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.addGroupRole({
          groupname: params.groupname,
          rolename: body.rolename,
          priority: body.priority
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          if (response.error === "Role not found") {
            return reply.notFound("Role not found");
          }

          if (response.error === "Group is already in this role" || response.error === "Role already in group") {
            return reply.conflict(response.error);
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to add role to group");
        }

        return { message: "Role added to group" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:groupname/roles (Remove Group Role)
  // ==========================================
  fastify.delete("/:groupname/roles",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Groups", "MQTT"],
        summary: "Removes a role from a group",
        description: "Removes a role from a specific group in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: RemoveGroupRoleParamsSchema,
        body: RemoveGroupRoleBodySchema,
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
      const { params, body } = request;

      if (INVALID_GROUP_NAME.includes(params.groupname)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_GROUPS.includes(params.groupname)) {
        return reply.forbidden(`System group '${params.groupname}' roles cannot be modified directly.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.removeGroupRole({
          groupname: params.groupname,
          rolename: body.rolename
        })).responses;

        if (response?.error) {
          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          if (response.error === "Role not found" || response.error === "Role not associated with group" || response.error === "Role not in group") {
            return reply.notFound(response.error);
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to remove role from group");
        }

        return { message: "Role removed from group" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );
}

export default groupRoutes;

