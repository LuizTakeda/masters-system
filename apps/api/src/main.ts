import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fastify, { type FastifyError, type FastifyReply, type FastifyRequest } from 'fastify'
import autoload from "@fastify/autoload"
import swaggerPlugin from "./plugins/swagger.js"
import cors from "./plugins/cors.js"
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
//import prismaPlugin from "@plugins/prisma.js"
import fastifySensible from "@fastify/sensible"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDevelopment = process.env.NODE_ENV !== 'production';

const app = fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

//**************************************************
// Plugins
//**************************************************

await app.register(fastifySensible);
await app.register(cors);
//await app.register(prismaPlugin);

if (isDevelopment) {
  await app.register(swaggerPlugin);
}

//**************************************************
// Routes
//**************************************************

app.setErrorHandler((
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);

  if (error.statusCode && error.statusCode < 500) {
    return reply.send(error);
  }

  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Ocorreu um erro interno inesperado no servidor."
  });
});

await app.register(autoload, {
  dir: join(__dirname, 'routes'),
  options: { prefix: "/api" },
  matchFilter: /.*\.routes\.(ts|js)$/
})

//**************************************************
// Start
//**************************************************

try {
  await app.listen({ port: 3000, host: '0.0.0.0' })

} catch (error) {
  app.log.error(error);
  process.exit(1);
}