import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fastify from 'fastify';
import autoload from '@fastify/autoload';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import cors$1 from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import 'dotenv/config';
import z$1, { z } from 'zod';
import fastifyCookie from '@fastify/cookie';
import fastifyOAuth2 from '@fastify/oauth2';
import 'simple-oauth2';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { EventEmitter } from 'events';
import mqtt from 'mqtt';
import 'pino';

var swaggerPlugin = fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "System Swagger",
        description: "System API",
        version: "0.1.0"
      },
      servers: [
        {
          url: "/api",
          description: "Current Server"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    transform: jsonSchemaTransform
  });
  await fastify.register(swaggerUI, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "none",
      deepLinking: false
    },
    uiHooks: {
      onRequest: function(request, reply, next) {
        next();
      },
      preHandler: function(request, reply, next) {
        next();
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });
});

var cors = fp(async (fastify) => {
  await fastify.register(cors$1, {
    origin: fastify.config.CORS_ORIGIN,
    credentials: true
  });
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3e3),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z.string().transform((val) => val.split(",").map((origin) => origin.trim())),
  KEYCLOAK_CLIENT_ID: z.string(),
  KEYCLOAK_CLIENT_SECRET: z.string(),
  KEYCLOAK_REALM: z.string(),
  MQTT_BROKER_URL: z.string(),
  MQTT_BROKER_USERNAME: z.string(),
  MQTT_BROKER_PASSWORD: z.string()
});
var envPlugin = fp(async (fastify) => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid .env");
    console.error(result.error.issues);
    throw new Error("Invalid .env");
  }
  fastify.decorate("config", result.data);
});

var oauth2Plugin = fp(async (fastify) => {
  await fastify.register(fastifyCookie);
  await fastify.register(fastifyOAuth2, {
    name: "keycloakOAuth2",
    credentials: {
      client: {
        id: fastify.config.KEYCLOAK_CLIENT_ID,
        secret: fastify.config.KEYCLOAK_CLIENT_SECRET
      }
    },
    discovery: {
      issuer: `https://auth.system.local/realms/${fastify.config.KEYCLOAK_REALM}`
    },
    callbackUri: "https://app.system.local/api/auth/callback",
    scope: ["openid", "profile", "email"],
    cookie: {
      secure: true,
      sameSite: "lax",
      path: "/"
    }
  });
});

var josePlugin = fp(async (fastify) => {
  const KEYCLOAK_ISSUER = "https://auth.system.local/realms/iot-dashboard";
  const JWKS_URI = new URL(`${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`);
  const JWKS = createRemoteJWKSet(JWKS_URI);
  fastify.decorate(
    "authenticate",
    async (request, reply) => {
      const accessToken = request.cookies.access_token;
      if (!accessToken) {
        return reply.unauthorized();
      }
      try {
        const { payload } = await jwtVerify(accessToken, JWKS, {
          issuer: KEYCLOAK_ISSUER
        });
        request.user = payload;
      } catch (err) {
        return reply.unauthorized();
      }
    }
  );
  fastify.decorate(
    "authenticateAdmin",
    async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
        if (reply.sent) {
          return;
        }
        const roles = request.user?.realm_access?.roles || [];
        if (!roles.includes("system-admin")) {
          return reply.forbidden();
        }
      } catch (err) {
        return reply.unauthorized();
      }
    }
  );
});

const ListRolesSchema = z$1.object({
  command: z$1.literal("listRoles"),
  verbose: z$1.boolean().optional().default(false),
  count: z$1.number().min(-1).max(50),
  offset: z$1.number().nonnegative()
});
const ListRolesResponseSchema = z$1.object({
  responses: z$1.array(
    z$1.object({
      command: z$1.literal("listRoles"),
      error: z$1.string().optional(),
      data: z$1.object({
        totalCount: z$1.number().int().nonnegative(),
        roles: z$1.array(z$1.string()).optional().default([])
      }).optional()
    })
  )
});
const ListRolesResponseVerboseSchema = z$1.object({
  responses: z$1.array(
    z$1.object({
      command: z$1.literal("listRoles"),
      error: z$1.string().optional(),
      data: z$1.object({
        totalCount: z$1.number().int().nonnegative(),
        roles: z$1.array(z$1.object({
          rolename: z$1.string(),
          textdescription: z$1.string().optional(),
          allowwildcardsubs: z$1.boolean().optional(),
          acls: z$1.array(z$1.object({
            acltype: z$1.string(),
            topic: z$1.string(),
            priority: z$1.number().int(),
            allow: z$1.boolean()
          })).optional().default([])
        }))
      }).optional()
    })
  )
});
const GetRoleSchema = z$1.object({
  command: z$1.literal("getRole"),
  rolename: z$1.string().min(1).max(100)
});
const GetRoleResponseSchema = z$1.object({
  responses: z$1.array(
    z$1.object({
      command: z$1.literal("getRole"),
      error: z$1.string().optional(),
      data: z$1.object({
        role: z$1.object({
          rolename: z$1.string(),
          textdescription: z$1.string().optional(),
          allowwildcardsubs: z$1.boolean().optional(),
          acls: z$1.array(z$1.object({
            acltype: z$1.string().describe("Permission type (e.g., publishClientSend, subscribePattern)"),
            topic: z$1.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
            priority: z$1.number().describe("Rule priority"),
            allow: z$1.boolean().describe("If true, allows access; if false, explicitly denies it")
          })).default([])
        })
      }).optional()
    })
  )
});
const CreateRoleSchema = z$1.object({
  command: z$1.literal("createRole"),
  rolename: z$1.string().min(1, "Role name is required").max(100),
  textname: z$1.string().min(1).max(100).optional(),
  textdescription: z$1.string().min(1).max(256).optional(),
  acls: z$1.array(z$1.object({
    acltype: z$1.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type (e.g., publishClientSend, subscribePattern)"),
    topic: z$1.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
    priority: z$1.number().describe("Rule priority"),
    allow: z$1.boolean().describe("If true, allows access; if false, explicitly denies it")
  })).optional()
});
const CreateRoleResponseSchema = z$1.object({
  responses: z$1.array(z$1.object({
    command: z$1.literal("createRole"),
    error: z$1.string().optional()
  }))
});
const DeleteRoleSchema = z$1.object({
  command: z$1.literal("deleteRole"),
  rolename: z$1.string().min(1).max(100)
});
const DeleteRoleResponseSchema = z$1.object({
  responses: z$1.array(z$1.object({
    command: z$1.literal("deleteRole"),
    error: z$1.string().optional()
  }))
});
const AddRoleACLSchema = z$1.object({
  command: z$1.literal("addRoleACL"),
  rolename: z$1.string().min(1).max(100),
  "acltype": z$1.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type (e.g., publishClientSend, subscribePattern)"),
  topic: z$1.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
  priority: z$1.number().describe("Rule priority"),
  allow: z$1.boolean().describe("If true, allows access; if false, explicitly denies it")
});
const AddRoleACLResponseSchema = z$1.object({
  responses: z$1.array(z$1.object({
    command: z$1.literal("addRoleACL"),
    error: z$1.string().optional()
  }))
});
const RemoveRoleACLSchema = z$1.object({
  command: z$1.literal("removeRoleACL"),
  rolename: z$1.string().min(1).max(100),
  acltype: z$1.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type"),
  topic: z$1.string().min(1).describe("MQTT topic filter")
});
const RemoveRoleACLResponseSchema = z$1.object({
  responses: z$1.array(z$1.object({
    command: z$1.literal("removeRoleACL"),
    error: z$1.string().optional()
  }))
});

const ListClientsSchema = z.object({
  command: z.literal("listClients"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.number().nonnegative().describe("Where in the list to start")
});
const ListClientsResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("listClients"),
    error: z.string().optional(),
    data: z.object({
      totalCount: z.number(),
      clients: z.array(z.string())
    }).optional()
  }))
});
const ListClientsVerboseResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listClients"),
      error: z.string().optional(),
      data: z.object({
        totalCount: z.number().int().nonnegative(),
        clients: z.array(
          z.object({
            username: z.string(),
            clientid: z.string().optional(),
            textname: z.string().optional(),
            textdescription: z.string().optional(),
            roles: z.array(
              z.object({
                rolename: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            groups: z.array(
              z.object({
                groupname: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            connections: z.array(
              z.object({
                address: z.string()
              })
            ).optional().default([])
          })
        ).optional().default([])
      }).optional()
    })
  )
});
const GetClientSchema = z.object({
  command: z.literal("getClient"),
  username: z.string().min(1, "Username is required")
});
const GetClientResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("getClient"),
      error: z.string().optional(),
      data: z.object({
        client: z.object({
          username: z.string(),
          clientid: z.string().optional(),
          textname: z.string().optional(),
          textdescription: z.string().optional(),
          disabled: z.boolean().optional(),
          roles: z.array(
            z.object({
              rolename: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          groups: z.array(
            z.object({
              groupname: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          connections: z.array(
            z.object({
              address: z.string()
            })
          ).optional().default([])
        })
      }).optional()
    })
  )
});
const CreateClientSchema = z.object({
  command: z.literal("createClient"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  clientid: z.string().optional(),
  textname: z.string().optional(),
  textdescription: z.string().optional(),
  groups: z.array(z.object({
    groupname: z.string().min(1),
    priority: z.number().optional()
  })).optional(),
  roles: z.array(z.object({
    rolename: z.string().min(1),
    priority: z.number().optional()
  })).optional()
});
const CreateClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createClient"),
    error: z.string().optional()
  }))
});
const DeleteClientSchema = z.object({
  command: z.literal("deleteClient"),
  username: z.string().min(1, "Username is required")
});
const DeleteClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("deleteClient"),
    error: z.string().optional()
  }))
});
const EnableClientSchema = z.object({
  command: z.literal("enableClient"),
  username: z.string().min(1, "Username is required")
});
const EnableClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("enableClient"),
    error: z.string().optional()
  }))
});
const DisableClientSchema = z.object({
  command: z.literal("disableClient"),
  username: z.string().min(1, "Username is required")
});
const DisableClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("disableClient"),
    error: z.string().optional()
  }))
});
const SetClientPasswordSchema = z.object({
  command: z.literal("setClientPassword"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "New password is required")
});
const SetClientPasswordResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("setClientPassword"),
    error: z.string().optional()
  }))
});
const AddClientRoleSchema = z.object({
  command: z.literal("addClientRole"),
  username: z.string().min(1, "Username is required"),
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional().describe("Optional priority")
});
const AddClientRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addClientRole"),
    error: z.string().optional()
  }))
});
const RemoveClientRoleSchema = z.object({
  command: z.literal("removeClientRole"),
  username: z.string().min(1, "Username is required"),
  rolename: z.string().min(1, "Role name to remove is required")
});
const RemoveClientRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeClientRole"),
    error: z.string().optional()
  }))
});

const ListGroupsSchema = z.object({
  command: z.literal("listGroups"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.number().nonnegative().describe("Where in the list to start")
});
const ListGroupsResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("listGroups"),
    error: z.string().optional(),
    data: z.object({
      totalCount: z.number(),
      groups: z.array(z.string())
    }).optional()
  }))
});
const ListGroupsVerboseResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listGroups"),
      error: z.string().optional(),
      data: z.object({
        totalCount: z.number().int().nonnegative(),
        groups: z.array(
          z.object({
            groupname: z.string(),
            textname: z.string().optional(),
            textdescription: z.string().optional(),
            roles: z.array(
              z.object({
                rolename: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            clients: z.array(
              z.object({
                username: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([])
          })
        ).optional().default([])
      }).optional()
    })
  )
});
const GetGroupSchema = z.object({
  command: z.literal("getGroup"),
  groupname: z.string().min(1, "Group name is required")
});
const GetGroupResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("getGroup"),
      error: z.string().optional(),
      data: z.object({
        group: z.object({
          groupname: z.string(),
          textname: z.string().optional(),
          textdescription: z.string().optional(),
          roles: z.array(
            z.object({
              rolename: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          clients: z.array(
            z.object({
              username: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([])
        })
      }).optional()
    })
  )
});
const CreateGroupSchema = z.object({
  command: z.literal("createGroup"),
  groupname: z.string().min(1, "Group name is required"),
  roles: z.array(z.object({
    rolename: z.string().min(1),
    priority: z.number().optional()
  })).optional()
});
const CreateGroupResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createGroup"),
    error: z.string().optional()
  }))
});
const DeleteGroupSchema = z.object({
  command: z.literal("deleteGroup"),
  groupname: z.string().min(1, "Group name is required")
});
const DeleteGroupResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("deleteGroup"),
    error: z.string().optional()
  }))
});
const AddGroupClientSchema = z.object({
  command: z.literal("addGroupClient"),
  groupname: z.string().min(1, "Group name is required"),
  username: z.string().min(1, "Username is required"),
  priority: z.number().optional().describe("Priority of the group for the client")
});
const AddGroupClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addGroupClient"),
    error: z.string().optional()
  }))
});
const RemoveGroupClientSchema = z.object({
  command: z.literal("removeGroupClient"),
  groupname: z.string().min(1, "Group name is required"),
  username: z.string().min(1, "Username is required")
});
const RemoveGroupClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeGroupClient"),
    error: z.string().optional()
  }))
});
const AddGroupRoleSchema = z.object({
  command: z.literal("addGroupRole"),
  groupname: z.string().min(1, "Group name is required"),
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional().describe("Optional priority")
});
const AddGroupRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addGroupRole"),
    error: z.string().optional()
  }))
});
const RemoveGroupRoleSchema = z.object({
  command: z.literal("removeGroupRole"),
  groupname: z.string().min(1, "Group name is required"),
  rolename: z.string().min(1, "Role name is required")
});
const RemoveGroupRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeGroupRole"),
    error: z.string().optional()
  }))
});

const CMD_TOPIC = "$CONTROL/dynamic-security/v1";
const RESP_TOPIC = "$CONTROL/dynamic-security/v1/response";
const DSCommandsSchema = z$1.object({
  commands: z$1.array(
    z$1.discriminatedUnion("command", [
      // Role Commands
      ListRolesSchema,
      GetRoleSchema,
      CreateRoleSchema,
      DeleteRoleSchema,
      AddRoleACLSchema,
      RemoveRoleACLSchema,
      // Client Commands
      ListClientsSchema,
      GetClientSchema,
      CreateClientSchema,
      DeleteClientSchema,
      EnableClientSchema,
      DisableClientSchema,
      SetClientPasswordSchema,
      AddClientRoleSchema,
      RemoveClientRoleSchema,
      // Group Commands
      ListGroupsSchema,
      GetGroupSchema,
      CreateGroupSchema,
      DeleteGroupSchema,
      AddGroupClientSchema,
      RemoveGroupClientSchema,
      AddGroupRoleSchema,
      RemoveGroupRoleSchema
    ])
  )
});
async function createCommandsQueue(client, messageEventStream) {
  await new Promise((resolve, reject) => {
    client.subscribe(RESP_TOPIC, (error) => {
      if (error) {
        reject(new Error(`Fail to subscribe: ${RESP_TOPIC}`));
        return;
      }
      resolve(null);
    });
  });
  const commandsQueue = [];
  let isProcessing = false;
  const processQueue = () => {
    if (isProcessing || commandsQueue.length <= 0) return;
    isProcessing = true;
    const commandsItem = commandsQueue.shift();
    let timeout = null;
    const messageCallback = (str) => {
      if (timeout) clearTimeout(timeout);
      try {
        commandsItem.resolve(JSON.parse(str));
      } catch (err) {
        commandsItem.reject(new Error("Failed to parse JSON response from broker"));
      }
      isProcessing = false;
      processQueue();
    };
    timeout = setTimeout(() => {
      messageEventStream.removeListener(RESP_TOPIC, messageCallback);
      commandsItem.reject(new Error("Broker response timeout"));
      isProcessing = false;
      processQueue();
    }, 1e3 * 5);
    messageEventStream.once(RESP_TOPIC, messageCallback);
    client.publish(CMD_TOPIC, JSON.stringify(commandsItem.payload), { qos: 1 }, (err) => {
      if (err) {
        if (timeout) clearTimeout(timeout);
        messageEventStream.removeListener(RESP_TOPIC, messageCallback);
        commandsItem.reject(err);
        isProcessing = false;
        processQueue();
      }
    });
  };
  return {
    /**
     * Validates and pushes a new command payload into the processing queue.
     * 
     * @param {DSCommandsType} payload - The dynamic security commands payload.
     * @returns {Promise<any>} A promise that resolves with the broker's response.
     * @throws {Error} If the provided payload fails Zod validation.
     */
    sendCommands: async (payload) => {
      const commands = DSCommandsSchema.safeParse(payload);
      if (!commands.success) {
        throw new Error("Invalid commands payload");
      }
      return new Promise((resolve, reject) => {
        commandsQueue.push({ payload: commands.data, resolve, reject });
        processQueue();
      });
    }
  };
}
async function createDynamicSecurityAPI(client, messageEventStream) {
  const { sendCommands } = await createCommandsQueue(client, messageEventStream);
  const listRoles = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "listRoles", verbose: false, ...payload }]
    });
    return ListRolesResponseSchema.parse(response);
  };
  const listRolesVerbose = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "listRoles", verbose: true, ...payload }]
    });
    return ListRolesResponseVerboseSchema.parse(response);
  };
  const getRole = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "getRole", ...payload }]
    });
    return GetRoleResponseSchema.parse(response);
  };
  const createRole = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "createRole", ...payload }]
    });
    return CreateRoleResponseSchema.parse(response);
  };
  const deleteRole = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "deleteRole", ...payload }]
    });
    return DeleteRoleResponseSchema.parse(response);
  };
  const addRoleACL = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "addRoleACL", ...payload }]
    });
    return AddRoleACLResponseSchema.parse(response);
  };
  const removeRoleACL = async (payload) => {
    const response = await sendCommands({
      commands: [{ command: "removeRoleACL", ...payload }]
    });
    return RemoveRoleACLResponseSchema.parse(response);
  };
  const listClients = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "listClients", verbose: false, ...payload }] });
    return ListClientsResponseSchema.parse(response);
  };
  const listClientsVerbose = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "listClients", verbose: true, ...payload }] });
    return ListClientsVerboseResponseSchema.parse(response);
  };
  const getClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "getClient", ...payload }] });
    return GetClientResponseSchema.parse(response);
  };
  const createClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "createClient", ...payload }] });
    return CreateClientResponseSchema.parse(response);
  };
  const deleteClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "deleteClient", ...payload }] });
    return DeleteClientResponseSchema.parse(response);
  };
  const enableClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "enableClient", ...payload }] });
    return EnableClientResponseSchema.parse(response);
  };
  const disableClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "disableClient", ...payload }] });
    return DisableClientResponseSchema.parse(response);
  };
  const setClientPassword = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "setClientPassword", ...payload }] });
    return SetClientPasswordResponseSchema.parse(response);
  };
  const addClientRole = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "addClientRole", ...payload }] });
    return AddClientRoleResponseSchema.parse(response);
  };
  const removeClientRole = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "removeClientRole", ...payload }] });
    return RemoveClientRoleResponseSchema.parse(response);
  };
  const listGroups = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "listGroups", verbose: false, ...payload }] });
    return ListGroupsResponseSchema.parse(response);
  };
  const listGroupsVerbose = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "listGroups", verbose: true, ...payload }] });
    return ListGroupsVerboseResponseSchema.parse(response);
  };
  const getGroup = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "getGroup", ...payload }] });
    return GetGroupResponseSchema.parse(response);
  };
  const createGroup = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "createGroup", ...payload }] });
    return CreateGroupResponseSchema.parse(response);
  };
  const deleteGroup = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "deleteGroup", ...payload }] });
    return DeleteGroupResponseSchema.parse(response);
  };
  const addGroupClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "addGroupClient", ...payload }] });
    return AddGroupClientResponseSchema.parse(response);
  };
  const removeGroupClient = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "removeGroupClient", ...payload }] });
    return RemoveGroupClientResponseSchema.parse(response);
  };
  const addGroupRole = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "addGroupRole", ...payload }] });
    return AddGroupRoleResponseSchema.parse(response);
  };
  const removeGroupRole = async (payload) => {
    const response = await sendCommands({ commands: [{ command: "removeGroupRole", ...payload }] });
    return RemoveGroupRoleResponseSchema.parse(response);
  };
  return {
    // Roles
    listRoles,
    listRolesVerbose,
    getRole,
    createRole,
    deleteRole,
    addRoleACL,
    removeRoleACL,
    // Clients
    listClients,
    listClientsVerbose,
    getClient,
    createClient,
    deleteClient,
    enableClient,
    disableClient,
    setClientPassword,
    addClientRole,
    removeClientRole,
    // Groups
    listGroups,
    listGroupsVerbose,
    getGroup,
    createGroup,
    deleteGroup,
    addGroupClient,
    removeGroupClient,
    addGroupRole,
    removeGroupRole
  };
}

async function createMQTTClient(fastify) {
  const logger = fastify.log.child({ name: "mqtt" });
  const mqttClient = mqtt.connect(fastify.config.MQTT_BROKER_URL, {
    clientId: "system-backend",
    protocolVersion: 5,
    username: fastify.config.MQTT_BROKER_USERNAME,
    password: fastify.config.MQTT_BROKER_PASSWORD
  });
  await new Promise((resolve, reject) => {
    mqttClient.on("connect", () => {
      logger.info(`Connected on ${fastify.config.MQTT_BROKER_URL}`);
      resolve(null);
    });
    mqttClient.on("error", () => {
      reject(new Error(`Fail to connect to ${fastify.config.MQTT_BROKER_URL}`));
    });
  });
  mqttClient.removeAllListeners("connect");
  mqttClient.removeAllListeners("error");
  mqttClient.on("connect", () => {
    logger.info("Reconnected to broker");
  });
  mqttClient.on("reconnect", () => {
    logger.warn("Trying to reconnect...");
  });
  mqttClient.on("offline", () => {
    logger.warn("Client is offline (Network disconnected)");
  });
  mqttClient.on("disconnect", () => {
    logger.warn("Disconnected from broker");
  });
  mqttClient.on("error", (error) => {
    logger.error(`MQTT Error: ${error.message}`);
  });
  fastify.addHook("onClose", (instance, done) => {
    logger.info("Ending MQTT connection...");
    mqttClient.end(false, {}, () => {
      done();
    });
  });
  return mqttClient;
}

const topics = [];
var mqttPlugin = fp(async (fastify) => {
  const logger = fastify.log.child({ name: "mqtt" });
  const messageEvents = new EventEmitter();
  const mqttClient = await createMQTTClient(fastify);
  mqttClient.on("message", (topic, message) => {
    messageEvents.emit(topic, message.toString());
  });
  if (topics.length > 0) {
    mqttClient.subscribe(topics, (error) => {
      if (error) {
        logger.error("Failed to subscribe to global topics");
        return;
      }
      logger.info("Successfully subscribed to global topics");
    });
  }
  const dynamicSecurityAPI = await createDynamicSecurityAPI(mqttClient, messageEvents);
  fastify.decorate("mqtt", {
    client: mqttClient,
    dynsec: dynamicSecurityAPI
  });
});

const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
const isDevelopment = process.env.NODE_ENV !== "production";
const app = fastify({
  logger: {
    name: "app"
  }
}).withTypeProvider();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(envPlugin);
await app.register(fastifySensible);
await app.register(cors);
await app.register(oauth2Plugin);
await app.register(josePlugin);
await app.register(mqttPlugin);
if (isDevelopment) {
  await app.register(swaggerPlugin);
}
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  if (error.statusCode) {
    return reply.send(error);
  }
  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Internal server error, contact staf"
  });
});
await app.register(autoload, {
  dir: join(__dirname$1, "routes"),
  options: { prefix: "/api" },
  matchFilter: /.*\.routes\.(ts|js)$/
});
try {
  await app.listen({ port: 3e3, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
