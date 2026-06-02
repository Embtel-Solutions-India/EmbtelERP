import { createClient } from 'redis';
import { env } from './env.js';
export const redisClient = env.REDIS_URL
    ? createClient({ url: env.REDIS_URL })
    : null;
export async function connectRedis() {
    if (!redisClient) {
        return;
    }
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}
