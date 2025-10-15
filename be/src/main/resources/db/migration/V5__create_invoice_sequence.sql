-- Create sequence for Invoice ID starting from 10000
CREATE SEQUENCE IF NOT EXISTS invoice_sequence
    START WITH 10000
    INCREMENT BY 1
    MINVALUE 10000
    NO MAXVALUE
    CACHE 1;

-- If Invoice table doesn't exist, create it
CREATE TABLE IF NOT EXISTS Invoice (
    InvoiceId BIGINT PRIMARY KEY DEFAULT nextval('invoice_sequence'),
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    totalAmount DOUBLE PRECISION NOT NULL
);

-- Reset sequence to ensure it starts from 10000
SELECT setval('invoice_sequence', 10000, false);

-- Insert sample invoices using explicit sequence nextval
-- Invoice cho các booking đã completed (giả sử có một số booking hoàn thành)
INSERT INTO Invoice (InvoiceId, createdDate, totalAmount) VALUES
    (nextval('invoice_sequence'), '2025-10-01 10:30:00', 150000.0),  -- Invoice cho việc đổi pin LITHIUM_ION
    (nextval('invoice_sequence'), '2025-10-02 14:15:00', 120000.0),  -- Invoice cho việc đổi pin NICKEL_METAL_HYDRIDE
    (nextval('invoice_sequence'), '2025-10-03 09:45:00', 180000.0),  -- Invoice cho việc đổi pin LEAD_ACID
    (nextval('invoice_sequence'), '2025-10-04 16:20:00', 150000.0),  -- Invoice cho việc đổi pin LITHIUM_ION
    (nextval('invoice_sequence'), '2025-10-05 11:10:00', 200000.0),  -- Invoice cho multiple battery swap
    (nextval('invoice_sequence'), '2025-10-06 13:30:00', 150000.0),  -- Invoice cho việc đổi pin LITHIUM_ION
    (nextval('invoice_sequence'), '2025-10-07 08:45:00', 120000.0),  -- Invoice cho việc đổi pin NICKEL_METAL_HYDRIDE
    (nextval('invoice_sequence'), '2025-10-08 17:25:00', 175000.0),  -- Invoice cho việc đổi pin premium
    (nextval('invoice_sequence'), '2025-10-09 12:15:00', 150000.0),  -- Invoice cho việc đổi pin LITHIUM_ION
    (nextval('invoice_sequence'), '2025-10-10 15:40:00', 190000.0);  -- Invoice cho việc đổi pin express service

-- Update một số booking để liên kết với invoice (giả sử booking ID từ 1-10 tồn tại)
-- Chỉ update nếu booking tồn tại và chưa có invoice
UPDATE Booking
SET InvoiceId = 10000
WHERE BookingId = 1 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10001
WHERE BookingId = 2 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10002
WHERE BookingId = 3 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10003
WHERE BookingId = 4 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10004
WHERE BookingId = 5 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10005
WHERE BookingId = 6 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10006
WHERE BookingId = 7 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10007
WHERE BookingId = 8 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10008
WHERE BookingId = 9 AND InvoiceId IS NULL;

UPDATE Booking
SET InvoiceId = 10009
WHERE BookingId = 10 AND InvoiceId IS NULL;
