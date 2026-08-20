import mqtt from "mqtt"
import { ListRolesResponseVerboseSchema, ListRolesSchema, type ListRolesType } from "./role.schemas.js"
import z from "zod"
import type { EventEmitter } from "events"

const CMD_TOPIC = "$CONTROL/dynamic-security/v1";
const RESP_TOPIC = "$CONTROL/dynamic-security/v1/response";

const DSCommandsSchema = z.object({
  commands: z.array(
    z.discriminatedUnion("command", [
      ListRolesSchema
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

  const listRoles = async (payload: Omit<ListRolesType, "command">) => {
    const response = await sendCommands({
      commands: [
        {
          command: "listRoles",
          ...payload
        }
      ]
    });

    return ListRolesResponseVerboseSchema.parse(response);
  }

  return {
    listRoles,
  }
}

export type DynamicSecurityAPI = Awaited<ReturnType<typeof createDynamicSecurityAPI>>;