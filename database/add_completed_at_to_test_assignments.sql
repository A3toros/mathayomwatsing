-- Add completed_at column to control teacher visibility of completed tests
ALTER TABLE test_assignments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Backfill: ensure completed tests are marked invisible to students as well
-- (No-op here; application logic will set is_active=false on completion.)


