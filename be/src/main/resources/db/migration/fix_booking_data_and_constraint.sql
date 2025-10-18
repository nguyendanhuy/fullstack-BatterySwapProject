-- Fix existing booking statuses before adding the new constraint
-- Step 1: Check current booking statuses in database
SELECT bookingstatus, COUNT(*) as count
FROM Booking
GROUP BY bookingstatus;

-- Step 2: Update old PENDING status to PENDINGPAYMENT
UPDATE Booking
SET bookingstatus = 'PENDINGPAYMENT'
WHERE bookingstatus = 'PENDING';

-- Step 3: Update any other invalid statuses
UPDATE Booking
SET bookingstatus = 'PENDINGPAYMENT'
WHERE bookingstatus NOT IN ('PENDINGPAYMENT', 'PENDINGSWAPPING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Step 4: Verify all statuses are now valid
SELECT bookingstatus, COUNT(*) as count
FROM Booking
GROUP BY bookingstatus;

-- Step 5: Now add the constraint (should work without error)
ALTER TABLE Booking ADD CONSTRAINT chk_booking_status
CHECK (bookingstatus IN ('PENDINGPAYMENT', 'PENDINGSWAPPING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));

-- Step 6: Update default value
ALTER TABLE Booking ALTER COLUMN bookingstatus SET DEFAULT 'PENDINGPAYMENT';

-- Step 7: Verify constraint was created successfully (using correct syntax for modern PostgreSQL)
SELECT conname, pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'chk_booking_status' AND t.relname = 'booking';
