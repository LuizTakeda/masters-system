import "dotenv/config"
import fp from "fastify-plugin";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z
    .string()
    .transform((val) => val.split(",").map((origin) => origin.trim())),
  KEYCLOAK_CLIENT_ID: z.string(),
  KEYCLOAK_CLIENT_SECRET: z.string(),
  KEYCLOAK_REALM: z.string()
});

type Env = z.infer<typeof envSchema>;

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
  }
}

export default fp(async (fastify) => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid .env");

    console.error(result.error.issues);

    throw new Error("Invalid .env");
  }

  fastify.decorate("config", result.data);
});