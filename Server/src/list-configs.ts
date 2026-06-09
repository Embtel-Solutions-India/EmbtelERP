import { prisma } from "./config/prisma.js";

async function main() {
  console.log("Listing all dashboard configs in DB...");
  try {
    const counts = await prisma.dashboardConfig.groupBy({
      by: ['role'],
      _count: {
        _all: true
      }
    });
    console.log("Configs by role:", counts);
    
    const all = await prisma.dashboardConfig.findMany({
      orderBy: { role: 'asc' }
    });
    console.log("Total records:", all.length);
  } catch (err) {
    console.error("Failed to query configs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
