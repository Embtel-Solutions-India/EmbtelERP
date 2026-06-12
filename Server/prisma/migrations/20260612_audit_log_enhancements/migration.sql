-- Audit log enhancements: new ActivityAction value + AuditLog.entityName.
-- NOTE: ALTER TYPE ... ADD VALUE is intentionally not wrapped in a transaction
-- so it works across Postgres versions; both statements are idempotent.

ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'PAYMENT_STATUS_CHANGE';

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityName" TEXT;
