-- This migration updates the PerspectiveSession model to support the perspective
-- navigation system.  add_perspective_role_types runs first alphabetically and may
-- have already created PerspectiveTargetType, so the CREATE TYPE is wrapped in a
-- DO block to be idempotent.

DO $$ BEGIN
  CREATE TYPE "PerspectiveTargetType" AS ENUM (
    'ORGANIZATION', 'BUSINESS', 'DEPARTMENT', 'TEAM', 'EMPLOYEE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to PerspectiveSession (each IF NOT EXISTS is a no-op when already present)
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "perspectiveType"     "PerspectiveTargetType" NOT NULL DEFAULT 'EMPLOYEE';
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "perspectiveTargetId" TEXT                   NOT NULL DEFAULT '';
ALTER TABLE "PerspectiveSession" ADD COLUMN IF NOT EXISTS "updatedAt"           TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "PerspectiveSession_userId_idx"               ON "PerspectiveSession" ("userId");
CREATE INDEX IF NOT EXISTS "PerspectiveSession_perspectiveTargetId_idx"  ON "PerspectiveSession" ("perspectiveTargetId");
