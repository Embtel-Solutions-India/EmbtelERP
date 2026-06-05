-- Create PerspectiveTargetType if it does not already exist (runs before add_perspective_types
-- alphabetically, so it must create the enum itself).  If the type already exists, the DO
-- block's EXCEPTION handler silently skips the creation.
DO $$ BEGIN
  CREATE TYPE "PerspectiveTargetType" AS ENUM (
    'ORGANIZATION', 'BUSINESS', 'BUSINESS_OWNER', 'DEPARTMENT',
    'TEAM', 'EMPLOYEE', 'VERTICAL', 'HEAD', 'MANAGER', 'INTERN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend with new values when the type already existed without them (each is a no-op
-- when the value is already present).
ALTER TYPE "PerspectiveTargetType" ADD VALUE IF NOT EXISTS 'BUSINESS_OWNER';
ALTER TYPE "PerspectiveTargetType" ADD VALUE IF NOT EXISTS 'VERTICAL';
ALTER TYPE "PerspectiveTargetType" ADD VALUE IF NOT EXISTS 'HEAD';
ALTER TYPE "PerspectiveTargetType" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "PerspectiveTargetType" ADD VALUE IF NOT EXISTS 'INTERN';
