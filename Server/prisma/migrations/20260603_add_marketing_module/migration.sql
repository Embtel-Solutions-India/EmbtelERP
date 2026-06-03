-- Additive migration: marketing module tables and enums
BEGIN;

DO $$ BEGIN
  CREATE TYPE "MarketingCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingActivityType" AS ENUM ('SOCIAL_MEDIA', 'LEAD_GENERATION', 'DAILY_REPORT', 'TASK_UPDATE', 'CAMPAIGN_UPDATE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingKPIType" AS ENUM ('LEADS_GENERATED', 'CAMPAIGN_SUCCESS', 'TASK_COMPLETION', 'PRODUCTIVITY', 'BUDGET_UTILIZATION', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "MarketingCampaign" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "teamId" TEXT,
  "createdById" TEXT,
  "assignedToId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "channel" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "budget" DECIMAL(14,2),
  "budgetSpent" DECIMAL(14,2),
  "targetLeads" INTEGER,
  "actualLeads" INTEGER NOT NULL DEFAULT 0,
  "successMetric" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingCampaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingCampaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingCampaign_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MarketingTask" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "teamId" TEXT,
  "campaignId" TEXT,
  "assignedToId" TEXT,
  "createdById" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "MarketingTaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingTask_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingTask_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MarketingLead" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "teamId" TEXT,
  "campaignId" TEXT,
  "createdById" TEXT,
  "assignedToId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT NOT NULL,
  "status" "MarketingLeadStatus" NOT NULL DEFAULT 'NEW',
  "estimatedValue" DECIMAL(14,2),
  "notes" TEXT,
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingLead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingLead_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingLead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MarketingActivity" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "teamId" TEXT,
  "campaignId" TEXT,
  "taskId" TEXT,
  "leadId" TEXT,
  "actorId" TEXT,
  "type" "MarketingActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MarketingTask"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "MarketingLead"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MarketingKPI" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "teamId" TEXT,
  "employeeId" TEXT,
  "campaignId" TEXT,
  "metricType" "MarketingKPIType" NOT NULL,
  "name" TEXT NOT NULL,
  "value" DECIMAL(14,2) NOT NULL,
  "target" DECIMAL(14,2),
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingKPI_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingKPI_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketingKPI_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingKPI_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MarketingKPI_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MarketingCampaign_organizationId_idx" ON "MarketingCampaign" ("organizationId");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_businessId_idx" ON "MarketingCampaign" ("businessId");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_teamId_idx" ON "MarketingCampaign" ("teamId");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_assignedToId_idx" ON "MarketingCampaign" ("assignedToId");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_status_idx" ON "MarketingCampaign" ("status");

CREATE INDEX IF NOT EXISTS "MarketingTask_organizationId_idx" ON "MarketingTask" ("organizationId");
CREATE INDEX IF NOT EXISTS "MarketingTask_businessId_idx" ON "MarketingTask" ("businessId");
CREATE INDEX IF NOT EXISTS "MarketingTask_teamId_idx" ON "MarketingTask" ("teamId");
CREATE INDEX IF NOT EXISTS "MarketingTask_campaignId_idx" ON "MarketingTask" ("campaignId");
CREATE INDEX IF NOT EXISTS "MarketingTask_assignedToId_idx" ON "MarketingTask" ("assignedToId");
CREATE INDEX IF NOT EXISTS "MarketingTask_status_idx" ON "MarketingTask" ("status");

CREATE INDEX IF NOT EXISTS "MarketingLead_organizationId_idx" ON "MarketingLead" ("organizationId");
CREATE INDEX IF NOT EXISTS "MarketingLead_businessId_idx" ON "MarketingLead" ("businessId");
CREATE INDEX IF NOT EXISTS "MarketingLead_teamId_idx" ON "MarketingLead" ("teamId");
CREATE INDEX IF NOT EXISTS "MarketingLead_campaignId_idx" ON "MarketingLead" ("campaignId");
CREATE INDEX IF NOT EXISTS "MarketingLead_assignedToId_idx" ON "MarketingLead" ("assignedToId");
CREATE INDEX IF NOT EXISTS "MarketingLead_status_idx" ON "MarketingLead" ("status");

CREATE INDEX IF NOT EXISTS "MarketingActivity_organizationId_idx" ON "MarketingActivity" ("organizationId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_businessId_idx" ON "MarketingActivity" ("businessId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_teamId_idx" ON "MarketingActivity" ("teamId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_campaignId_idx" ON "MarketingActivity" ("campaignId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_taskId_idx" ON "MarketingActivity" ("taskId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_leadId_idx" ON "MarketingActivity" ("leadId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_actorId_idx" ON "MarketingActivity" ("actorId");
CREATE INDEX IF NOT EXISTS "MarketingActivity_type_idx" ON "MarketingActivity" ("type");

CREATE INDEX IF NOT EXISTS "MarketingKPI_organizationId_idx" ON "MarketingKPI" ("organizationId");
CREATE INDEX IF NOT EXISTS "MarketingKPI_businessId_idx" ON "MarketingKPI" ("businessId");
CREATE INDEX IF NOT EXISTS "MarketingKPI_teamId_idx" ON "MarketingKPI" ("teamId");
CREATE INDEX IF NOT EXISTS "MarketingKPI_employeeId_idx" ON "MarketingKPI" ("employeeId");
CREATE INDEX IF NOT EXISTS "MarketingKPI_campaignId_idx" ON "MarketingKPI" ("campaignId");
CREATE INDEX IF NOT EXISTS "MarketingKPI_metricType_idx" ON "MarketingKPI" ("metricType");

COMMIT;
