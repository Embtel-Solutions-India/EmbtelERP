import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16).default("change-me-in-production"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("change-me-in-production-refresh"),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);

// Fail fast in production on insecure defaults: the Zod defaults exist only so
// local dev boots without a full .env, but they must never reach production.
if (env.NODE_ENV === "production") {
  const WEAK_SECRETS = ["change-me-in-production", "change-me-in-production-refresh"];
  if (
    WEAK_SECRETS.includes(env.JWT_ACCESS_SECRET) ||
    WEAK_SECRETS.includes(env.JWT_REFRESH_SECRET)
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET / JWT_REFRESH_SECRET must be set to strong, non-default values in production",
    );
  }
  if (env.CORS_ORIGIN === "*") {
    throw new Error(
      "CORS_ORIGIN must be an explicit origin allowlist (not '*') in production",
    );
  }
}
