-- CreateEnum
CREATE TYPE "ITBoardColumn" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "ITPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "ITSprint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetPoints" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITSprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITSprintTask" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "column" "ITBoardColumn" NOT NULL DEFAULT 'BACKLOG',
    "priority" "ITPriority" NOT NULL DEFAULT 'MEDIUM',
    "storyPoints" INTEGER,
    "prdRef" TEXT,
    "dueDate" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITSprintTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITBurndownPoint" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "idealPoints" INTEGER NOT NULL,
    "actualPoints" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ITBurndownPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITEodReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "teamId" TEXT,
    "employeeId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "completed" TEXT NOT NULL,
    "pending" TEXT,
    "blockers" TEXT,
    "tomorrow" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITEodReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ITSprint_businessId_idx" ON "ITSprint"("businessId");

-- CreateIndex
CREATE INDEX "ITSprint_teamId_idx" ON "ITSprint"("teamId");

-- CreateIndex
CREATE INDEX "ITSprint_isActive_idx" ON "ITSprint"("isActive");

-- CreateIndex
CREATE INDEX "ITSprintTask_sprintId_idx" ON "ITSprintTask"("sprintId");

-- CreateIndex
CREATE INDEX "ITSprintTask_businessId_idx" ON "ITSprintTask"("businessId");

-- CreateIndex
CREATE INDEX "ITSprintTask_teamId_idx" ON "ITSprintTask"("teamId");

-- CreateIndex
CREATE INDEX "ITSprintTask_assigneeId_idx" ON "ITSprintTask"("assigneeId");

-- CreateIndex
CREATE INDEX "ITSprintTask_column_idx" ON "ITSprintTask"("column");

-- CreateIndex
CREATE INDEX "ITBurndownPoint_sprintId_idx" ON "ITBurndownPoint"("sprintId");

-- CreateIndex
CREATE UNIQUE INDEX "ITBurndownPoint_sprintId_dayIndex_key" ON "ITBurndownPoint"("sprintId", "dayIndex");

-- CreateIndex
CREATE INDEX "ITEodReport_businessId_idx" ON "ITEodReport"("businessId");

-- CreateIndex
CREATE INDEX "ITEodReport_employeeId_idx" ON "ITEodReport"("employeeId");

-- CreateIndex
CREATE INDEX "ITEodReport_reportDate_idx" ON "ITEodReport"("reportDate");

-- AddForeignKey
ALTER TABLE "ITSprint" ADD CONSTRAINT "ITSprint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprint" ADD CONSTRAINT "ITSprint_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprint" ADD CONSTRAINT "ITSprint_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "ITSprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSprintTask" ADD CONSTRAINT "ITSprintTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITBurndownPoint" ADD CONSTRAINT "ITBurndownPoint_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "ITSprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEodReport" ADD CONSTRAINT "ITEodReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEodReport" ADD CONSTRAINT "ITEodReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEodReport" ADD CONSTRAINT "ITEodReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEodReport" ADD CONSTRAINT "ITEodReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

