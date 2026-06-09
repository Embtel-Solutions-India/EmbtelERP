import { prisma } from "./config/prisma.js";

async function main() {
  console.log("Connecting to database and running diagnostic queries...");
  try {
    const start = Date.now();
    const employeeCount = await prisma.employee.count();
    console.log(`Successfully connected! Employee count: ${employeeCount} (took ${Date.now() - start}ms)`);
    
    const layoutConfigs = await prisma.dashboardConfig.count();
    console.log(`DashboardConfig count: ${layoutConfigs}`);

    const sample = await prisma.dashboardConfig.findFirst();
    console.log("Sample dashboard config:", sample);
  } catch (err) {
    console.error("Database diagnostic failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
