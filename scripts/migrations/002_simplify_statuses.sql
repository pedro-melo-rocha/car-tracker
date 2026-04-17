-- Drop old constraint first so the UPDATEs below don't violate it
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_chk;

-- Migrate existing data to new status values
UPDATE cars SET status = 'dismissed'   WHERE status IN ('inactive', 'rejected');
UPDATE cars SET status = 'final-offer' WHERE status = 'bought';

-- Add new constraint
ALTER TABLE cars ADD CONSTRAINT cars_status_chk
  CHECK (status IN ('to-contact', 'contacted', 'negotiating', 'dismissed', 'final-offer'));
