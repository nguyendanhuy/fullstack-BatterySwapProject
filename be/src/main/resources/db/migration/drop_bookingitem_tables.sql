-- Script to drop BookingBatteryItem and BookingVehicleItem tables
-- This will clean up the database to use only Booking table

-- Step 1: Check if the specific tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bookingbatteryitem', 'bookingvehicleitem')
ORDER BY table_name;

-- Step 2: Drop foreign key constraints first (if any)
-- Check constraints that reference these tables
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name IN ('bookingbatteryitem', 'bookingvehicleitem')
     OR ccu.table_name IN ('bookingbatteryitem', 'bookingvehicleitem'));

-- Step 3: Drop the specific tables
DROP TABLE IF EXISTS bookingbatteryitem CASCADE;
DROP TABLE IF EXISTS bookingvehicleitem CASCADE;

-- Step 4: Verify tables were dropped
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bookingbatteryitem', 'bookingvehicleitem')
ORDER BY table_name;

-- Step 5: Check if any sequences related to these tables need to be dropped
SELECT sequence_name
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND (sequence_name LIKE '%bookingbatteryitem%' OR sequence_name LIKE '%bookingvehicleitem%');

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS bookingbatteryitem_seq CASCADE;
DROP SEQUENCE IF EXISTS bookingvehicleitem_seq CASCADE;
