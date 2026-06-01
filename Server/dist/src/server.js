import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
async function main() {
    const app = createApp();
    app.listen(env.PORT, () => {
        logger.info("server started", { port: env.PORT });
    });
}
void main().catch(async (error) => {
    logger.error("failed to start server", { error });
    await prisma.$disconnect();
    process.exit(1);
});
