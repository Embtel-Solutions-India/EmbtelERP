-- This migration updates the PerspectiveType enum and PerspectiveSession model
-- to support the new perspective navigation system with TEAM and EMPLOYEE types.

-- Create new enum type for perspective navigation
CREATE TYPE "PerspectiveTargetType" AS ENUM ('ORGANIZATION', 'BUSINESS', 'DEPARTMENT', 'TEAM', 'EMPLOYEE');

-- Add new columns to PerspectiveSession
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "perspectiveType" "PerspectiveTargetType" NOT NULL DEFAULT 'EMPLOYEE';
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "perspectiveTargetId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "PerspectiveSession_userId_idx" ON "PerspectiveSession"("userId");
CREATE INDEX IF NOT EXISTS "PerspectiveSession_perspectiveTargetId_idx" ON "PerspectiveSession"("perspectiveTargetId");