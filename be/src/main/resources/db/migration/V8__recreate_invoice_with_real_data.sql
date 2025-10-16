-- Migration để tạo lại bảng Invoice với dữ liệu thực từ booking
-- V8: Recreate Invoice table with real data from existing bookings

-- Step 1: Drop existing Invoice table completely
DROP TABLE IF EXISTS Invoice CASCADE;

-- Step 2: Recreate Invoice table with all necessary columns
CREATE TABLE Invoice (
    invoiceid BIGINT PRIMARY KEY DEFAULT nextval('invoice_sequence'),
    userid VARCHAR(255),
    createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    totalamount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    priceperswap DOUBLE PRECISION DEFAULT 15000.0,
    numberofswaps INTEGER DEFAULT 0,
    invoicestatus VARCHAR(20) DEFAULT 'PENDING' NOT NULL
);

-- Step 3: Add check constraint for invoicestatus
ALTER TABLE Invoice
ADD CONSTRAINT chk_invoice_status
CHECK (invoicestatus IN ('PENDING', 'PAID', 'CANCELLED', 'COMPLETED'));

-- Step 4: Reset sequence to start from 10000
DROP SEQUENCE IF EXISTS invoice_sequence CASCADE;
CREATE SEQUENCE invoice_sequence
    START WITH 10000
    INCREMENT BY 1
    MINVALUE 10000
    NO MAXVALUE
    CACHE 1;

-- Step 5: Create invoices from real booking data
-- Insert invoices based on bookings that have been paid
INSERT INTO Invoice (invoiceid, userid, createddate, totalamount, priceperswap, numberofswaps, invoicestatus)
SELECT
    nextval('invoice_sequence') as invoiceid,
    b.userid,
    COALESCE(b.completedtime::timestamp, CURRENT_TIMESTAMP) as createddate,
    COALESCE(b.amount, 15000.0) as totalamount,
    COALESCE(b.amount, 15000.0) as priceperswap,
    1 as numberofswaps,
    CASE
        WHEN b.paymentstatus = 'PAID' AND b.bookingstatus = 'COMPLETED' THEN 'COMPLETED'
        WHEN b.paymentstatus = 'PAID' THEN 'PAID'
        ELSE 'PENDING'
    END as invoicestatus
FROM booking b
WHERE b.paymentstatus = 'PAID'
    AND b.userid IS NOT NULL
    AND b.amount IS NOT NULL
    AND b.amount > 0
ORDER BY b.bookingdate
LIMIT 20; -- Giới hạn 20 invoice đầu tiên để tránh quá nhiều

-- Step 6: Update booking table to link with newly created invoices
-- Link each paid booking with corresponding invoice
UPDATE booking
SET invoiceid = inv.invoiceid
FROM (
    SELECT
        i.invoiceid,
        i.userid,
        i.createddate,
        ROW_NUMBER() OVER (PARTITION BY i.userid ORDER BY i.createddate) as rn
    FROM Invoice i
) inv
WHERE booking.userid = inv.userid
    AND booking.paymentstatus = 'PAID'
    AND booking.invoiceid IS NULL
    AND inv.rn = 1; -- Chỉ link với invoice đầu tiên của mỗi user

-- Step 7: Create additional invoices for remaining paid bookings without invoice
INSERT INTO Invoice (invoiceid, userid, createddate, totalamount, priceperswap, numberofswaps, invoicestatus)
SELECT
    nextval('invoice_sequence') as invoiceid,
    b.userid,
    CURRENT_TIMESTAMP as createddate,
    COALESCE(b.amount, 15000.0) as totalamount,
    COALESCE(b.amount, 15000.0) as priceperswap,
    1 as numberofswaps,
    'PAID' as invoicestatus
FROM booking b
WHERE b.paymentstatus = 'PAID'
    AND b.invoiceid IS NULL
    AND b.userid IS NOT NULL
    AND b.amount IS NOT NULL
    AND b.amount > 0
LIMIT 10; -- Thêm tối đa 10 invoice nữa

-- Step 8: Final update to link remaining bookings
UPDATE booking
SET invoiceid = (
    SELECT i.invoiceid
    FROM Invoice i
    WHERE i.userid = booking.userid
        AND i.invoicestatus = 'PAID'
    ORDER BY i.createddate DESC
    LIMIT 1
)
WHERE booking.paymentstatus = 'PAID'
    AND booking.invoiceid IS NULL
    AND booking.userid IS NOT NULL;
