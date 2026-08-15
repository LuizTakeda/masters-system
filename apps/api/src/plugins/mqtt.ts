import fp from "fastify-plugin"
import { EventEmitter } from "events";
import mqtt from "mqtt"

declare module 'fastify' {
  interface FastifyInstance {
    mqttClient: mqtt.MqttClient,
    mqttEvents: EventEmitter,
    mqttSendCommand: (payload: any) => Promise<any>,
  }
}

const DYNSEC_CMD_TOPIC = "$CONTROL/dynamic-security/v1";
const DYNSEC_RESP_TOPIC = "$CONTROL/dynamic-security/v1/response";

const topics: string[] = [DYNSEC_RESP_TOPIC];

export default fp(async (fastify) => {
  const mqttEvents = new EventEmitter();

  const mqttClient = mqtt.connect(fastify.config.MQTT_BROKER_URL, {
    clientId: "system-backend",
    protocolVersion: 5,
    username: fastify.config.MQTT_BROKER_USERNAME,
    password: fastify.config.MQTT_BROKER_PASSWORD,
  })

  await new Promise((resolve, reject) => {
    mqttClient.on('connect', () => {
      fastify.log.info('Conectado ao Broker MQTT com sucesso!');

      mqttClient.subscribe(topics, (err) => {
        if (err) {
          fastify.log.error(`Fail to subscribe on topics:${err}`);
        }
      });

      resolve(true);
    });

    mqttClient.on('error', (err) => {
      reject(err);
    });
  });

  mqttClient.on('message', (topic, message) => {
    mqttEvents.emit('message', {
      topic,
      payload: message.toString(),
    });

    mqttEvents.emit(topic, message.toString());
  });


  // =========================================
  type QueueItem = {
    payload: any;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  };

  const commandQueue: QueueItem[] = [];
  let isProcessing = false;

  const processQueue = () => {
    // Se a fila estiver vazia ou já estiver processando um comando, não faz nada
    if (isProcessing || commandQueue.length === 0) return;

    isProcessing = true;

    // Retira o primeiro comando da fila
    const currentCommand = commandQueue.shift();
    if (!currentCommand) return;

    // Timeout de 5 segundos para não travar a fila caso o Mosquitto não responda
    const timeout = setTimeout(() => {
      mqttEvents.removeAllListeners(DYNSEC_RESP_TOPIC); // Remove o listener huérfano
      isProcessing = false;
      currentCommand.reject(new Error("Timeout esperando resposta do Mosquitto Dynamic Security"));
      processQueue(); // Chama o próximo da fila
    }, 5000);

    // Fica ouvindo APENAS a próxima mensagem que cair no tópico de resposta
    mqttEvents.once(DYNSEC_RESP_TOPIC, (messageStr: string) => {
      clearTimeout(timeout); // Cancela o timeout, pois a resposta chegou
      isProcessing = false;

      try {
        const parsedResponse = JSON.parse(messageStr);
        currentCommand.resolve(parsedResponse);
      } catch (err) {
        currentCommand.reject(err);
      }

      // Chama a função novamente para processar o próximo comando da fila
      processQueue();
    });

    // Publica o comando no broker
    const payloadStr = JSON.stringify(currentCommand.payload);
    mqttClient.publish(DYNSEC_CMD_TOPIC, payloadStr, { qos: 1 }, (err) => {
      if (err) {
        clearTimeout(timeout);
        mqttEvents.removeAllListeners(DYNSEC_RESP_TOPIC);
        isProcessing = false;
        currentCommand.reject(err);
        processQueue(); // Libera a fila
      }
    });
  };

  const mqttSendCommand = (payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      commandQueue.push({ payload, resolve, reject });
      processQueue(); // Aciona a máquina
    });
  };
  // =========================================


  fastify.decorate('mqttClient', mqttClient);
  fastify.decorate('mqttEvents', mqttEvents);
  fastify.decorate('mqttSendCommand', mqttSendCommand);

  fastify.addHook('onClose', (instance, done) => {
    instance.mqttClient.end();
    done();
  });
});