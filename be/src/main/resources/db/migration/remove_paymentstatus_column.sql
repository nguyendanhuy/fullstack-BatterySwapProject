-- Remove paymentstatus column from Booking table
-- This will simplify the system to use only bookingstatus

-- Step 1: Check current data before removal
SELECT
    bookingid,
    bookingstatus,
    paymentstatus,
    amount,
    bookingdate
FROM Booking
ORDER BY bookingid;

-- Step 2: Drop the paymentstatus column
ALTER TABLE Booking DROP COLUMN IF EXISTS paymentstatus;

-- Step 3: Verify the column was removed
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'booking'
ORDER BY ordinal_position;

-- Step 4: Check the table structure after removal
\d booking;
