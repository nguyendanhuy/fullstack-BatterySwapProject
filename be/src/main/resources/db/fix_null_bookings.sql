-- ============================================
-- SCRIPT: Fix null values in Booking table
-- Purpose: Update old booking records with missing StationId, VehicleId, or vehicleType
-- ============================================

-- Step 1: Check current status
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN "StationId" IS NULL THEN 1 END) as null_station_count,
    COUNT(CASE WHEN "VehicleId" IS NULL THEN 1 END) as null_vehicle_count,
    COUNT(CASE WHEN vehicletype IS NULL THEN 1 END) as null_vehicletype_count
FROM "Booking";

-- Step 2: View problematic records
SELECT 
    "BookingId",
    "UserId",
    "StationId",
    "VehicleId",
    vehicletype,
    "InvoiceId",
    bookingdate,
    bookingstatus
FROM "Booking"
WHERE "StationId" IS NULL 
   OR "VehicleId" IS NULL 
   OR vehicletype IS NULL
ORDER BY "BookingId" DESC
LIMIT 50;

-- ============================================
-- OPTION 1: Delete invalid bookings (CAREFUL!)
-- ============================================
-- Uncomment if you want to DELETE bookings with null foreign keys
/*
DELETE FROM "Booking"
WHERE "StationId" IS NULL 
   OR "VehicleId" IS NULL;
*/

-- ============================================
-- OPTION 2: Set default values for null fields
-- ============================================
-- Update vehicleType from Vehicle table if VehicleId exists
UPDATE "Booking" b
SET vehicletype = v."VehicleType"
FROM "Vehicle" v
WHERE b."VehicleId" = v."VehicleId"
  AND b.vehicletype IS NULL
  AND b."VehicleId" IS NOT NULL;

-- ============================================
-- OPTION 3: Find and assign a default Station/Vehicle
-- ============================================
-- For bookings without StationId, assign the first available station
-- (only if you have a default/fallback station)
/*
UPDATE "Booking"
SET "StationId" = (SELECT "StationId" FROM "Station" ORDER BY "StationId" LIMIT 1)
WHERE "StationId" IS NULL;
*/

-- For bookings without VehicleId, you might need to:
-- 1. Check if UserId has any vehicles registered
-- 2. Or mark these bookings as CANCELLED
/*
UPDATE "Booking"
SET bookingstatus = 'CANCELLED',
    "CancellationReason" = 'Missing vehicle information - system cleanup'
WHERE "VehicleId" IS NULL;
*/

-- ============================================
-- Step 3: Verify the fix
-- ============================================
SELECT 
    COUNT(*) as remaining_null_bookings
FROM "Booking"
WHERE "StationId" IS NULL 
   OR "VehicleId" IS NULL 
   OR vehicletype IS NULL;
