import { type FastifyInstance } from "fastify";
import mqtt from "mqtt";

/**
 * Creates, configures, and establishes a connection to an MQTT broker.
 * 
 * This function implements a fail-fast mechanism during initialization, 
 * blocking the Fastify boot process until the connection is successfully established. 
 * If the initial connection fails, it rejects the promise and halts the server startup.
 * Additionally, it registers a graceful shutdown hook to safely terminate the 
 * MQTT connection when the Fastify instance stops.
 * 
 * @param {FastifyInstance} fastify - The Fastify application instance containing the environment configuration and logger.
 * @returns {Promise<mqtt.MqttClient>} A promise that resolves to the connected and configured MQTT client instance.
 * @throws {Error} Throws an error if the initial connection to the MQTT broker fails.
 */
export async function createMQTTClient(fastify: FastifyInstance): Promise<mqtt.MqttClient> {
  // Initialize a child logger specifically for the MQTT module to improve trace accuracy
  const logger = fastify.log.child({ name: "mqtt" });

  const mqttClient = mqtt.connect(fastify.config.MQTT_BROKER_URL, {
    clientId: "system-backend",
    protocolVersion: 5,
    username: fastify.config.MQTT_BROKER_USERNAME,
    password: fastify.config.MQTT_BROKER_PASSWORD,
  });

  // 1. Block the Fastify boot process until the MQTT connection is established (Fail-Fast)
  await new Promise((resolve, reject) => {
    mqttClient.on("connect", () => {
      logger.info(`Connected on ${fastify.config.MQTT_BROKER_URL}`);
      resolve(null);
    });

    mqttClient.on("error", () => {
      reject(new Error(`Fail to connect to ${fastify.config.MQTT_BROKER_URL}`));
    });
  });

  // 2. Clear initial boot listeners to prevent memory leaks and duplicate event handling
  mqttClient.removeAllListeners("connect");
  mqttClient.removeAllListeners("error");

  // 3. Attach persistent lifecycle event listeners for ongoing monitoring and observability
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

  // 4. Register a graceful shutdown hook to cleanly close the connection upon server termination
  fastify.addHook("onClose", (instance, done) => {
    logger.info("Ending MQTT connection...");

    // Utilize the locally scoped mqttClient to ensure the correct connection is closed
    // before the Fastify instance drops its decorators.
    mqttClient.end(false, {}, () => {
      done();
    });
  });

  return mqttClient;
}