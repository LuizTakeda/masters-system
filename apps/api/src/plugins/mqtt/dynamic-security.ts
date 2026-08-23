import mqtt from "mqtt"
import { AddRoleACLResponseSchema, AddRoleACLSchema, CreateRoleResponseSchema, CreateRoleSchema, DeleteRoleResponseSchema, DeleteRoleSchema, GetRoleResponseSchema, GetRoleSchema, ListRolesResponseSchema, ListRolesResponseVerboseSchema, ListRolesSchema, RemoveRoleACLResponseSchema, RemoveRoleACLSchema, type AddRoleACLType, type CreateRoleType, type DeleteRoleType, type GetRoleType, type ListRolesType, type RemoveRoleACLType } from "./role.schemas.js"
import z from "zod"
import type { EventEmitter } from "events"
import { AddClientRoleResponseSchema, AddClientRoleSchema, CreateClientResponseSchema, CreateClientSchema, DeleteClientResponseSchema, DeleteClientSchema, DisableClientResponseSchema, DisableClientSchema, EnableClientResponseSchema, EnableClientSchema, GetClientResponseSchema, GetClientSchema, ListClientsResponseSchema, ListClientsSchema, ListClientsVerboseResponseSchema, RemoveClientRoleResponseSchema, RemoveClientRoleSchema, SetClientPasswordResponseSchema, SetClientPasswordSchema, type AddClientRoleType, type CreateClientType, type DeleteClientType, type DisableClientType, type EnableClientType, type GetClientType, type ListClientsType, type RemoveClientRoleType, type SetClientPasswordType } from "./client.schemas.js";
import { AddGroupClientResponseSchema, AddGroupClientSchema, AddGroupRoleResponseSchema, AddGroupRoleSchema, CreateGroupResponseSchema, CreateGroupSchema, DeleteGroupResponseSchema, DeleteGroupSchema, GetGroupResponseSchema, GetGroupSchema, ListGroupsResponseSchema, ListGroupsSchema, ListGroupsVerboseResponseSchema, RemoveGroupClientResponseSchema, RemoveGroupClientSchema, RemoveGroupRoleResponseSchema, RemoveGroupRoleSchema, type AddGroupClientType, type AddGroupRoleType, type CreateGroupType, type DeleteGroupType, type GetGroupType, type ListGroupsType, type RemoveGroupClientType, type RemoveGroupRoleType } from "./group.schemas.js";

const CMD_TOPIC = "$CONTROL/dynamic-security/v1";
const RESP_TOPIC = "$CONTROL/dynamic-security/v1/response";

const DSCommandsSchema = z.object({
  commands: z.array(
    z.discriminatedUnion("command", [
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

type DSCommandsType = z.infer<typeof DSCommandsSchema>;

type CommandsQueueItem = {
  payload: DSCommandsType;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

/**
 * Creates and manages an isolated queue for MQTT commands.
 * Ensures that commands are sent sequentially and handles response timeouts.
 * 
 * @param {mqtt.MqttClient} client - The active MQTT client instance.
 * @param {EventEmitter} messageEventStream - The event emitter listening to broker responses.
 * @returns An object containing the `sendCommands` method.
 */
async function createCommandsQueue(client: mqtt.MqttClient, messageEventStream: EventEmitter) {
  await new Promise((resolve, reject) => {
    client.subscribe(RESP_TOPIC, (error) => {
      if (error) {
        reject(new Error(`Fail to subscribe: ${RESP_TOPIC}`));
        return;
      }

      resolve(null);
    });
  })


  const commandsQueue: Array<CommandsQueueItem> = [];
  let isProcessing = false;

  /**
   * Processes the next command in the queue.
   * Locks the queue until a response is received or a timeout occurs.
   */
  const processQueue = () => {
    if (isProcessing || commandsQueue.length <= 0) return;

    isProcessing = true;
    const commandsItem = commandsQueue.shift()!;

    let timeout: NodeJS.Timeout | null = null;

    /**
     * Callback triggered when a response is received from the broker.
     * @param {string} str - The stringified JSON payload from the broker.
     */
    const messageCallback = (str: string) => {
      if (timeout) clearTimeout(timeout);

      try {
        commandsItem.resolve(JSON.parse(str));
      } catch (err) {
        commandsItem.reject(new Error("Failed to parse JSON response from broker"));
      }

      isProcessing = false;
      processQueue();
    }

    // Set a 5-second timeout to prevent the queue from hanging
    timeout = setTimeout(() => {
      messageEventStream.removeListener(RESP_TOPIC, messageCallback);
      commandsItem.reject(new Error("Broker response timeout"));
      isProcessing = false;
      processQueue();
    }, 1000 * 5);

    // Listen for the next incoming response
    messageEventStream.once(RESP_TOPIC, messageCallback);

    // Publish the command and handle potential network errors
    client.publish(CMD_TOPIC, JSON.stringify(commandsItem.payload), { qos: 1 }, (err) => {
      if (err) {
        if (timeout) clearTimeout(timeout);
        messageEventStream.removeListener(RESP_TOPIC, messageCallback);
        commandsItem.reject(err);
        isProcessing = false;
        processQueue();
      }
    });
  }

  return {
    /**
     * Validates and pushes a new command payload into the processing queue.
     * 
     * @param {DSCommandsType} payload - The dynamic security commands payload.
     * @returns {Promise<any>} A promise that resolves with the broker's response.
     * @throws {Error} If the provided payload fails Zod validation.
     */
    sendCommands: async (payload: DSCommandsType) => {
      const commands = DSCommandsSchema.safeParse(payload);

      if (!commands.success) {
        throw new Error("Invalid commands payload");
      }

      return new Promise((resolve, reject) => {
        commandsQueue.push({ payload: commands.data, resolve, reject });
        processQueue();
      });
    }
  }
}

/**
 * Factory function to initialize the Mosquitto Dynamic Security API.
 * 
 * @param {mqtt.MqttClient} client - The active MQTT client instance.
 * @param {EventEmitter} messageEventStream - The event emitter for MQTT topics.
 * @returns The Dynamic Security API interface.
 */
export async function createDynamicSecurityAPI(client: mqtt.MqttClient, messageEventStream: EventEmitter) {
  const { sendCommands } = await createCommandsQueue(client, messageEventStream);

  // ==========================================
  // ROLES Commands
  // ==========================================
  const listRoles = async (payload: Omit<ListRolesType, "command" | "verbose">) => {
    const response = await sendCommands({
      commands: [{ command: "listRoles", verbose: false, ...payload }]
    });
    return ListRolesResponseSchema.parse(response);
  }

  const listRolesVerbose = async (payload: Omit<ListRolesType, "command" | "verbose">) => {
    const response = await sendCommands({
      commands: [{ command: "listRoles", verbose: true, ...payload }]
    });
    return ListRolesResponseVerboseSchema.parse(response);
  }

  const getRole = async (payload: Omit<GetRoleType, "command">) => {
    const response = await sendCommands({
      commands: [{ command: "getRole", ...payload }]
    });
    return GetRoleResponseSchema.parse(response);
  }

  const createRole = async (payload: Omit<CreateRoleType, "command">) => {
    const response = await sendCommands({
      commands: [{ command: "createRole", ...payload }]
    });

    return CreateRoleResponseSchema.parse(response);
  }

  const deleteRole = async (payload: Omit<DeleteRoleType, "command">) => {
    const response = await sendCommands({
      commands: [{ command: "deleteRole", ...payload }]
    });
    return DeleteRoleResponseSchema.parse(response);
  }

  const addRoleACL = async (payload: Omit<AddRoleACLType, "command">) => {
    const response = await sendCommands({
      commands: [{ command: "addRoleACL", ...payload }]
    });
    return AddRoleACLResponseSchema.parse(response);
  }

  const removeRoleACL = async (payload: Omit<RemoveRoleACLType, "command">) => {
    const response = await sendCommands({
      commands: [{ command: "removeRoleACL", ...payload }]
    });
    return RemoveRoleACLResponseSchema.parse(response);
  }

  // ==========================================
  // CLIENTS
  // ==========================================
  const listClients = async (payload: Omit<ListClientsType, "command" | "verbose">) => {
    const response = await sendCommands({ commands: [{ command: "listClients", verbose: false, ...payload }] });
    return ListClientsResponseSchema.parse(response);
  }

  const listClientsVerbose = async (payload: Omit<ListClientsType, "command" | "verbose">) => {
    const response = await sendCommands({ commands: [{ command: "listClients", verbose: true, ...payload }] });
    return ListClientsVerboseResponseSchema.parse(response);
  }

  const getClient = async (payload: Omit<GetClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "getClient", ...payload }] });
    return GetClientResponseSchema.parse(response);
  }

  const createClient = async (payload: Omit<CreateClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "createClient", ...payload }] });
    return CreateClientResponseSchema.parse(response);
  }

  const deleteClient = async (payload: Omit<DeleteClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "deleteClient", ...payload }] });
    return DeleteClientResponseSchema.parse(response);
  }

  const enableClient = async (payload: Omit<EnableClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "enableClient", ...payload }] });
    return EnableClientResponseSchema.parse(response);
  }

  const disableClient = async (payload: Omit<DisableClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "disableClient", ...payload }] });
    return DisableClientResponseSchema.parse(response);
  }

  const setClientPassword = async (payload: Omit<SetClientPasswordType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "setClientPassword", ...payload }] });
    return SetClientPasswordResponseSchema.parse(response);
  }

  const addClientRole = async (payload: Omit<AddClientRoleType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "addClientRole", ...payload }] });
    return AddClientRoleResponseSchema.parse(response);
  }

  const removeClientRole = async (payload: Omit<RemoveClientRoleType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "removeClientRole", ...payload }] });
    return RemoveClientRoleResponseSchema.parse(response);
  }

  // ==========================================
  // GROUPS
  // ==========================================
  const listGroups = async (payload: Omit<ListGroupsType, "command" | "verbose">) => {
    const response = await sendCommands({ commands: [{ command: "listGroups", verbose: false, ...payload }] });
    return ListGroupsResponseSchema.parse(response);
  }

  const listGroupsVerbose = async (payload: Omit<ListGroupsType, "command" | "verbose">) => {
    const response = await sendCommands({ commands: [{ command: "listGroups", verbose: true, ...payload }] });
    return ListGroupsVerboseResponseSchema.parse(response);
  }

  const getGroup = async (payload: Omit<GetGroupType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "getGroup", ...payload }] });
    return GetGroupResponseSchema.parse(response);
  }

  const createGroup = async (payload: Omit<CreateGroupType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "createGroup", ...payload }] });
    return CreateGroupResponseSchema.parse(response);
  }

  const deleteGroup = async (payload: Omit<DeleteGroupType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "deleteGroup", ...payload }] });
    return DeleteGroupResponseSchema.parse(response);
  }

  const addGroupClient = async (payload: Omit<AddGroupClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "addGroupClient", ...payload }] });
    return AddGroupClientResponseSchema.parse(response);
  }

  const removeGroupClient = async (payload: Omit<RemoveGroupClientType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "removeGroupClient", ...payload }] });
    return RemoveGroupClientResponseSchema.parse(response);
  }

  const addGroupRole = async (payload: Omit<AddGroupRoleType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "addGroupRole", ...payload }] });
    return AddGroupRoleResponseSchema.parse(response);
  }

  const removeGroupRole = async (payload: Omit<RemoveGroupRoleType, "command">) => {
    const response = await sendCommands({ commands: [{ command: "removeGroupRole", ...payload }] });
    return RemoveGroupRoleResponseSchema.parse(response);
  }

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
  }
}

export type DynamicSecurityAPI = Awaited<ReturnType<typeof createDynamicSecurityAPI>>;