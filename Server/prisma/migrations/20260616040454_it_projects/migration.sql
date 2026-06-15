-- AlterTable
ALTER TABLE "ITSprintTask" ADD COLUMN     "assignedById" TEXT,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "ITProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ITProject_businessId_idx" ON "ITProject"("businessId");

-- CreateIndex
CREATE INDEX "ITProject_teamId_idx" ON "ITProject"("teamId");

-- CreateIndex
CREATE INDEX "ITProject_status_idx" ON "ITProject"("status");

-- CreateIndex
CREATE INDEX "ITSprintTask_assignedById_idx" ON "ITSprintTask"("assignedById");

-- CreateIndex
CREATE INDEX "ITSprintTask_projectId_idx" ON "ITSprintTask"("projectId");

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ITProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITProject" ADD CONSTRAINT "ITProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITProject" ADD CONSTRAINT "ITProject_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITProject" ADD CONSTRAINT "ITProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

