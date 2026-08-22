import fp from "fastify-plugin";
import { EventEmitter } from "events";
import mqtt from "mqtt";
import { createDynamicSecurityAPI, type DynamicSecurityAPI } from "./dynamic-security.js";
import { createMQTTClient } from "./mqtt.js";

/**
 * Represents the MQTT namespace injected into the Fastify instance.
 * Provides access to both the raw MQTT client and the Mosquitto Dynamic Security API.
 */
export type FastifyMQTT = {
  client: mqtt.MqttClient;
  dynsec: DynamicSecurityAPI;
};

/**
 * Extends the core Fastify instance to include the custom `mqtt` decorator.
 * This enables fully typed access via `fastify.mqtt` across all routes and plugins.
 */
declare module 'fastify' {
  interface FastifyInstance {
    mqtt: FastifyMQTT;
  }
}

/**
 * A list of global MQTT topics to subscribe to upon successful connection.
 * Add application-wide topics (e.g., "sensors/#", "devices/status") here.
 * Note: Dynamic Security response topics are handled internally by its own module.
 */
const topics: string[] = [];

/**
 * Fastify plugin that initializes the MQTT ecosystem for the application.
 * 
 * This plugin performs the following initialization sequence:
 * 1. Establishes a fail-fast connection to the MQTT broker.
 * 2. Sets up an internal event emitter to bridge raw MQTT messages into Node.js events.
 * 3. Subscribes to any defined global topics.
 * 4. Initializes the Mosquitto Dynamic Security API instance.
 * 5. Decorates the Fastify instance with the `mqtt` namespace.
 * 
 * @param {FastifyInstance} fastify - The encapsulated Fastify instance.
 * @returns {Promise<void>}
 */
export default fp(async (fastify) => {
  // Initialize a child logger specifically for the main MQTT plugin lifecycle
  const logger = fastify.log.child({ name: "mqtt" });

  const messageEvents = new EventEmitter();

  // 1. Await the client connection (Fail-Fast mechanism is handled inside createMQTTClient)
  const mqttClient = await createMQTTClient(fastify);

  // 2. Bridge MQTT incoming messages to the internal event emitter
  mqttClient.on("message", (topic, message) => {
    messageEvents.emit(topic, message.toString());
  });

  // 3. Subscribe to global application topics (if any are defined)
  if (topics.length > 0) {
    mqttClient.subscribe(topics, (error) => {
      if (error) {
        logger.error("Failed to subscribe to global topics");
        return;
      }
      
      logger.info("Successfully subscribed to global topics");
    });
  }

  // 4. Initialize the Dynamic Security API, passing the client and the event bridge
  const dynamicSecurityAPI = await createDynamicSecurityAPI(mqttClient, messageEvents);

  // 5. Decorate the Fastify instance to expose the MQTT ecosystem
  fastify.decorate("mqtt", {
    client: mqttClient,
    dynsec: dynamicSecurityAPI,
  });
});