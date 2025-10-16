-- Migration to add missing columns to Invoice table
-- Add invoicestatus, userid, priceperswap, numberofswaps columns

-- Step 1: Add missing columns to Invoice table
ALTER TABLE Invoice
ADD COLUMN IF NOT EXISTS invoicestatus VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
ADD COLUMN IF NOT EXISTS userid VARCHAR(255),
ADD COLUMN IF NOT EXISTS priceperswap DOUBLE PRECISION DEFAULT 15000.0,
ADD COLUMN IF NOT EXISTS numberofswaps INTEGER DEFAULT 0;

-- Step 2: Update existing records with default values
UPDATE Invoice
SET invoicestatus = 'PENDING',
    priceperswap = 15000.0,
    numberofswaps = 1
WHERE invoicestatus IS NULL OR priceperswap IS NULL OR numberofswaps IS NULL;

-- Step 3: Add check constraint for invoicestatus enum values
ALTER TABLE Invoice
ADD CONSTRAINT chk_invoice_status
CHECK (invoicestatus IN ('PENDING', 'PAID', 'CANCELLED', 'COMPLETED'));

-- Step 4: Update some sample data to have realistic values
UPDATE Invoice SET
    userid = 'user1@example.com',
    invoicestatus = 'PAID',
    priceperswap = 25000.0,
    numberofswaps = 1
WHERE invoiceid = 10000;

UPDATE Invoice SET
    userid = 'user2@example.com',
    invoicestatus = 'PAID',
    priceperswap = 20000.0,
    numberofswaps = 1
WHERE invoiceid = 10001;

UPDATE Invoice SET
    userid = 'user3@example.com',
    invoicestatus = 'COMPLETED',
    priceperswap = 30000.0,
    numberofswaps = 1
WHERE invoiceid = 10002;
