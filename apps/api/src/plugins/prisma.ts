import "dotenv/config"
import fp from "fastify-plugin"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@generated/prisma/client.js"
import { Pool } from "pg";

declare module 'fastify' {
  interface FastifyInstance { prisma: PrismaClient }
}

export default fp(async (server, options) => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect()

  server.decorate('prisma', prisma)

  server.addHook('onClose', async (server) => {
    await server.prisma.$disconnect()
  })
})