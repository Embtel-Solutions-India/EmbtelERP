import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_ACCESS_SECRET: z.string().min(16).default('change-me-in-production'),
    JWT_REFRESH_SECRET: z.string().min(16).default('change-me-in-production-refresh'),
    REDIS_URL: z.string().optional(),
    CORS_ORIGIN: z.string().default('*'),
});
export const env = envSchema.parse(process.env);
