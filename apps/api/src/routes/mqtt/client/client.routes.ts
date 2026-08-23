import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
// Ajuste o import conforme a sua estrutura real:
import { HttpErrorSchema, ResponseMessageSchema } from "@repo/types/commons";
import {
  CreateClientBodySchema,
  DeleteClientParamsSchema,
  DisableClientParamsSchema,
  EnableClientParamsSchema,
  GetClientNamesQuerySchema,
  GetClientNamesResponseSchema,
  GetClientParamsSchema,
  GetClientResponseSchema,
  GetClientsQuerySchema,
  GetClientsResponseSchema
} from "@repo/types/endpoints/mqtt/client";

// ==========================================
// HTTP Schemas (Validação de Entrada)
// ==========================================
const PaginationQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

const ClientParamsSchema = z.object({
  username: z.string().min(1, "Username is required").max(100)
});

const SetPasswordBodySchema = z.object({
  password: z.string().min(1, "New password is required")
});

const AddClientRoleBodySchema = z.object({
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional()
});

const RemoveClientRoleBodySchema = z.object({
  rolename: z.string().min(1, "Role name to remove is required")
});

const SYSTEM_CLIENTS = [
  "admin",
];

const INVALID_CLIENT_NAME = [
  "names"
];

const clientRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // ==========================================
  // GET / (List Clients Verbose)
  // ==========================================
  fastify.get("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Lists MQTT clients with details",
        security: [{ bearerAuth: [] }],
        querystring: GetClientsQuerySchema,
        response: {
          200: GetClientsResponseSchema,
          500: HttpErrorSchema
        }
      },
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listClientsVerbose({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Fail to fetch clients");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // GET /names (List Clients)
  // ==========================================
  fastify.get("/names",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Lists MQTT client usernames",
        security: [{ bearerAuth: [] }],
        querystring: GetClientNamesQuerySchema,
        response: {
          200: GetClientNamesResponseSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.listClients({
          count: request.query.count,
          offset: request.query.offset
        })).responses;

        if (response?.error) {
          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Fail to fetch clients");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // GET /:username (Get Client)
  // ==========================================
  fastify.get("/:username",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Retrieves a specific MQTT client",
        description: "Fetches detailed configuration of a specific MQTT client.",
        security: [{ bearerAuth: [] }],
        params: GetClientParamsSchema,
        response: {
          200: GetClientResponseSchema,
          404: HttpErrorSchema,
          500: HttpErrorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const [response] = (await fastify.mqtt.dynsec.getClient({
          username: request.params.username
        })).responses;

        if (response?.error) {
          if (response.error === "Client not found") {
            return reply.notFound("Client not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Fail to fetch client");
        }

        return response?.data;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST / (Create Client)
  // ==========================================
  fastify.post("",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Creates a new MQTT client",
        description: "Creates a new client in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        body: CreateClientBodySchema,
        response: { 200: ResponseMessageSchema, 409: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { body } = request;

      if (INVALID_CLIENT_NAME.includes(body.username)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_CLIENTS.includes(body.username)) {
        return reply.conflict("Cannot create a client with a reserved system name.");
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.createClient({
          username: body.username,
          password: body.password,
          clientid: body.clientid,
          textname: body.textname,
          textdescription: body.textdescription,
          groups: body.groups,
          roles: body.roles,
        })).responses;

        if (response?.error) {
          if (response.error === "Client already exists") {
            return reply.conflict("Client already exists");
          }

          if (response.error === "Group not found") {
            return reply.notFound("Group not found");
          }

          if (response.error === "Role not found") {
            return reply.notFound("Role not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to create client");
        }

        return { message: "Client created" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // ==========================================
  // DELETE /:username (Delete Client)
  // ==========================================
  fastify.delete("/:username",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Deletes a specific MQTT client",
        description: "Deletes a specific client in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: DeleteClientParamsSchema,
        response: { 200: ResponseMessageSchema, 403: HttpErrorSchema, 404: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (INVALID_CLIENT_NAME.includes(params.username)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_CLIENTS.includes(params.username)) {
        return reply.forbidden(`The client '${params.username}' is a system client and cannot be deleted.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.deleteClient({
          username: params.username
        })).responses;

        if (response?.error) {
          if (response.error === "Client not found") {
            return reply.notFound("Client not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to delete client");
        }

        return { message: "Client deleted" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:username/enable (Enable Client)
  // ==========================================
  fastify.post("/:username/enable",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Enables an MQTT client",
        description: "Enables a specific client in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: EnableClientParamsSchema,
        response: { 200: ResponseMessageSchema, 404: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (INVALID_CLIENT_NAME.includes(params.username)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.enableClient({
          username: params.username
        })).responses;

        if (response?.error) {
          if (response.error === "Client not found") {
            return reply.notFound("Client not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to enable client");
        }

        return { message: "Client enabled" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:username/disable (Disable Client)
  // ==========================================
  fastify.post("/:username/disable",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Disables an MQTT client",
        description: "Disables a specific client in Mosquitto's Dynamic Security.",
        security: [{ bearerAuth: [] }],
        params: DisableClientParamsSchema,
        response: { 200: ResponseMessageSchema, 403: HttpErrorSchema, 404: HttpErrorSchema, 422: HttpErrorSchema, 500: HttpErrorSchema }
      }
    },
    async (request, reply) => {
      const { params } = request;

      if (INVALID_CLIENT_NAME.includes(params.username)) {
        return reply.unprocessableEntity("The word 'names' is a reserved keyword.");
      }

      if (SYSTEM_CLIENTS.includes(params.username)) {
        return reply.forbidden(`The client '${params.username}' is a system client and cannot be disabled.`);
      }

      try {
        const [response] = (await fastify.mqtt.dynsec.disableClient({
          username: params.username
        })).responses;

        if (response?.error) {
          if (response.error === "Client not found") {
            return reply.notFound("Client not found");
          }

          request.log.error(`Mosquitto Error: ${response.error}`);
          return reply.internalServerError("Failed to disable client");
        }

        return { message: "Client disabled" };
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // PUT /:username/password (Set Client Password)
  // ==========================================
  fastify.put("/:username/password",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Updates an MQTT client's password",
        security: [{ bearerAuth: [] }],
        params: ClientParamsSchema,
        body: SetPasswordBodySchema,
      }
    },
    async (request, reply) => {
      try {
        const response = await fastify.mqtt.dynsec.setClientPassword({
          username: request.params.username,
          password: request.body.password
        });
        return response;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // POST /:username/roles (Add Client Role)
  // ==========================================
  fastify.post("/:username/roles",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Adds a role to a client",
        security: [{ bearerAuth: [] }],
        params: ClientParamsSchema,
        body: AddClientRoleBodySchema,
      }
    },
    async (request, reply) => {
      try {
        const response = await fastify.mqtt.dynsec.addClientRole({
          username: request.params.username,
          rolename: request.body.rolename,
          priority: request.body.priority
        });
        return response;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );

  // ==========================================
  // DELETE /:username/roles (Remove Client Role)
  // ==========================================
  fastify.delete("/:username/roles",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["MQTT Clients", "MQTT"],
        summary: "Removes a role from a client",
        security: [{ bearerAuth: [] }],
        params: ClientParamsSchema,
        body: RemoveClientRoleBodySchema, // Usando Body para padronizar com AddRole
      }
    },
    async (request, reply) => {
      try {
        const response = await fastify.mqtt.dynsec.removeClientRole({
          username: request.params.username,
          rolename: request.body.rolename
        });
        return response;
      } catch (error) {
        request.log.error(error, "MQTT Broker communication failure");
        return reply.internalServerError("Service temporarily unavailable");
      }
    }
  );
}

export default clientRoutes;