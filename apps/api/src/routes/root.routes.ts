import { type FastifyPluginAsync } from "fastify";

const rootRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get("/", {
    schema: {
      tags: ["API Core"]
    }
  }, async (request, reply) => {
    return {
      status: "ok"
    };
  })

}

export default rootRoutes;