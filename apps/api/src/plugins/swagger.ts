import fp from "fastify-plugin"
import swagger from "@fastify/swagger"
import swaggerUI from "@fastify/swagger-ui"
import { jsonSchemaTransform } from "fastify-type-provider-zod"

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'System Swagger',
        description: 'System API',
        version: '0.1.0'
      },
      servers: [
        {
          url: '/api',
          description: 'Current Server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        }
      }
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
    transformSpecificationClone: true
  })
});