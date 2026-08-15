import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const mqttBrokerRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/client", async (request, reply) => {
    try {
      const comando = {
        commands: [{ command: "listClients" }]
      };

      // A mágica acontece aqui: 
      // Se 10 usuários baterem nessa rota ao mesmo tempo, 
      // o mqttSendCommand vai organizá-los em fila automaticamente.
      const respostaMosquitto = await fastify.mqttSendCommand(comando);

      return reply.send(respostaMosquitto);

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Falha na comunicação com o broker" });
    }
  });
}

export default mqttBrokerRoutes;