-- Add Vertical model and extend hierarchy with vertical support
-- This migration adds the Vertical layer between Head and Team Manager

-- Create Vertical table
CREATE TABLE IF NOT EXISTS "Vertical" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vertical_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vertical_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vertical_businessId_code_key" UNIQUE ("businessId", "code")
);

-- Add verticalId to Employee
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Employee_verticalId_idx" ON "Employee"("verticalId");

-- Add verticalId to Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "Team" ADD CONSTRAINT "Team_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add verticalId to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "Task" ADD CONSTRAINT "Task_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Task_verticalId_idx" ON "Task"("verticalId");

-- Add verticalId to MarketingCampaign
ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "MarketingCampaign_verticalId_idx" ON "MarketingCampaign"("verticalId");

-- Add verticalId to MarketingTask
ALTER TABLE "MarketingTask" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "MarketingTask" ADD CONSTRAINT "MarketingTask_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "MarketingTask_verticalId_idx" ON "MarketingTask"("verticalId");

-- Add verticalId to MarketingLead
ALTER TABLE "MarketingLead" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "MarketingLead" ADD CONSTRAINT "MarketingLead_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "MarketingLead_verticalId_idx" ON "MarketingLead"("verticalId");

-- Add verticalId to MarketingActivity
ALTER TABLE "MarketingActivity" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "MarketingActivity" ADD CONSTRAINT "MarketingActivity_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "MarketingActivity_verticalId_idx" ON "MarketingActivity"("verticalId");

-- Add verticalId to MarketingKPI
ALTER TABLE "MarketingKPI" ADD COLUMN IF NOT EXISTS "verticalId" TEXT;
ALTER TABLE "MarketingKPI" ADD CONSTRAINT "MarketingKPI_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "MarketingKPI_verticalId_idx" ON "MarketingKPI"("verticalId");

-- Update PerspectiveTargetType enum (add VERTICAL and HEAD if not present)
-- Note: This requires ALTER TYPE which may need to be run manually if the enum already exists
-- For fresh databases, the Prisma schema will create the correct enum