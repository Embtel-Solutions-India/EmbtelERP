-- Additive migration: add employeeCode, fullName, level to employee and create new tables
BEGIN;

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;

-- unique index for employeeCode
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_employeeCode_key" ON "Employee" ("employeeCode");

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "fullName" TEXT;

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "level" INTEGER;

-- Create PerspectiveSession table
CREATE TABLE IF NOT EXISTS "PerspectiveSession" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "perspectiveId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "PerspectiveSession_userId_idx" ON "PerspectiveSession" ("userId");
CREATE INDEX IF NOT EXISTS "PerspectiveSession_perspectiveId_idx" ON "PerspectiveSession" ("perspectiveId");

-- Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT,
  "token" TEXT UNIQUE NOT NULL,
  "data" JSONB,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" TEXT,
  "actorId" TEXT,
  "recipientId" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Notification_recipientId_idx" ON "Notification" ("recipientId");
CREATE INDEX IF NOT EXISTS "Notification_businessId_idx" ON "Notification" ("businessId");

COMMIT;
