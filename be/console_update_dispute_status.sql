-- Quick Console Script for DisputeTicket Status Update
-- Run this directly in PostgreSQL console

-- 1. Add new columns (safe - will not fail if columns already exist)
ALTER TABLE disputeticket
ADD COLUMN IF NOT EXISTS resolvedat TIMESTAMP,
ADD COLUMN IF NOT EXISTS resolutionmethod VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolutiondescription VARCHAR(1000);

-- 2. Check current status distribution
SELECT 'Current status distribution:' as info;
SELECT status, COUNT(*) as count FROM "disputeticket" GROUP BY status ORDER BY count DESC;

-- 3. Update old status values to new enum values
UPDATE "disputeticket" SET status = 'IN_PROGRESS' WHERE status = 'OPEN';
UPDATE "disputeticket" SET status = 'RESOLVED', resolvedat = COALESCE(resolvedat, createdat + INTERVAL '1 day') WHERE status IN ('CLOSED', 'COMPLETED');
UPDATE "disputeticket" SET status = 'IN_PROGRESS' WHERE status NOT IN ('IN_PROGRESS', 'RESOLVED');

-- 4. Set default resolution info for legacy resolved tickets
UPDATE "disputeticket"
SET resolutionmethod = 'Legacy Resolution',
    resolutiondescription = 'Đã giải quyết trước khi cập nhật hệ thống'
WHERE status = 'RESOLVED' AND resolutionmethod IS NULL;

-- 5. Verify results
SELECT 'Updated status distribution:' as info;
SELECT status, COUNT(*) as count FROM "disputeticket" GROUP BY status ORDER BY count DESC;

SELECT 'Resolved tickets with resolution info:' as info;
SELECT COUNT(*) as resolved_tickets_with_info FROM "disputeticket"
WHERE status = 'RESOLVED' AND resolutionmethod IS NOT NULL;
