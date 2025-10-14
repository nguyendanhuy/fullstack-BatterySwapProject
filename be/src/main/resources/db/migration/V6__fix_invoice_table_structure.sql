-- Migration to fix Invoice table structure
-- Remove duplicate 'id' column and use only 'invoiceid' as primary key

-- Step 1: Drop existing Invoice table if it has wrong structure
DROP TABLE IF EXISTS Invoice CASCADE;

-- Step 2: Recreate Invoice table with correct structure
CREATE TABLE Invoice (
    invoiceid BIGINT PRIMARY KEY DEFAULT nextval('invoice_sequence'),
    createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    totalamount DOUBLE PRECISION NOT NULL
);

-- Step 3: Ensure sequence exists and starts from 10000
CREATE SEQUENCE IF NOT EXISTS invoice_sequence
    START WITH 10000
    INCREMENT BY 1
    MINVALUE 10000
    NO MAXVALUE
    CACHE 1;

-- Reset sequence to start from 10000
SELECT setval('invoice_sequence', 10000, false);

-- Step 4: Insert sample invoices with correct column names
INSERT INTO Invoice (invoiceid, createddate, totalamount) VALUES
    (nextval('invoice_sequence'), '2025-10-01 10:30:00', 150000.0),
    (nextval('invoice_sequence'), '2025-10-02 14:15:00', 120000.0),
    (nextval('invoice_sequence'), '2025-10-03 09:45:00', 180000.0),
    (nextval('invoice_sequence'), '2025-10-04 16:20:00', 150000.0),
    (nextval('invoice_sequence'), '2025-10-05 11:10:00', 200000.0),
    (nextval('invoice_sequence'), '2025-10-06 13:30:00', 150000.0),
    (nextval('invoice_sequence'), '2025-10-07 08:45:00', 120000.0),
    (nextval('invoice_sequence'), '2025-10-08 17:25:00', 175000.0),
    (nextval('invoice_sequence'), '2025-10-09 12:15:00', 150000.0),
    (nextval('invoice_sequence'), '2025-10-10 15:40:00', 190000.0);

-- Step 5: Update Booking table foreign key to use invoiceid
-- First check if the foreign key constraint exists and drop it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'fk_booking_invoice') THEN
        ALTER TABLE Booking DROP CONSTRAINT fk_booking_invoice;
    END IF;
END $$;

-- Update booking records to link with new invoice IDs (if bookings exist)
UPDATE Booking SET InvoiceId = 10000 WHERE BookingId = 1 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10001 WHERE BookingId = 2 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10002 WHERE BookingId = 3 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10003 WHERE BookingId = 4 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10004 WHERE BookingId = 5 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10005 WHERE BookingId = 6 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10006 WHERE BookingId = 7 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10007 WHERE BookingId = 8 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10008 WHERE BookingId = 9 AND InvoiceId IS NULL;
UPDATE Booking SET InvoiceId = 10009 WHERE BookingId = 10 AND InvoiceId IS NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE Booking
ADD CONSTRAINT fk_booking_invoice
FOREIGN KEY (InvoiceId) REFERENCES Invoice(invoiceid) ON DELETE SET NULL;
