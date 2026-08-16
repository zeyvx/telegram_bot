import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  REDIS_URL: z.string().url().or(z.string().startsWith("redis://")),
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  PUBLIC_API_URL: z.string().url(),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  WEB_PORT: z.coerce.number().int().min(1).max(65535).default(3001)
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}
