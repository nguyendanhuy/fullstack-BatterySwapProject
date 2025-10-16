-- Script cập nhật schema cho Invoice và Booking tables
-- Chạy script này để thêm các cột mới

-- 1. Cập nhật bảng Invoice
ALTER TABLE Invoice
ADD COLUMN IF NOT EXISTS priceperswap DOUBLE PRECISION DEFAULT 15000.0,
ADD COLUMN IF NOT EXISTS numberofswaps INTEGER DEFAULT 0;

-- Cập nhật các invoice hiện có
UPDATE Invoice
SET priceperswap = 15000.0
WHERE priceperswap IS NULL;

UPDATE Invoice
SET numberofswaps = (
    SELECT COUNT(*)
    FROM Booking
    WHERE Booking.InvoiceId = Invoice.invoiceid
)
WHERE numberofswaps = 0 OR numberofswaps IS NULL;

-- Cập nhật lại totalamount dựa trên công thức mới
UPDATE Invoice
SET totalamount = priceperswap * numberofswaps
WHERE priceperswap IS NOT NULL AND numberofswaps IS NOT NULL;

-- 2. Cập nhật bảng Booking
ALTER TABLE Booking
ADD COLUMN IF NOT EXISTS vehicletype VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION;

-- Cập nhật vehicleType từ bảng Vehicle cho các booking hiện có
UPDATE Booking b
SET vehicletype = v.vehicletype::VARCHAR
FROM Vehicle v
WHERE b.VehicleId = v.VehicleId
AND b.vehicletype IS NULL;

-- Cập nhật amount mặc định cho các booking hiện có
UPDATE Booking
SET amount = 15000.0
WHERE amount IS NULL;

-- 3. Tạo index để tối ưu hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_booking_vehicletype ON Booking(vehicletype);
CREATE INDEX IF NOT EXISTS idx_booking_amount ON Booking(amount);
CREATE INDEX IF NOT EXISTS idx_invoice_numberofswaps ON Invoice(numberofswaps);

-- 4. Xem kết quả
SELECT
    invoiceid,
    createddate,
    priceperswap,
    numberofswaps,
    totalamount,
    (priceperswap * numberofswaps) as calculated_total
FROM Invoice
ORDER BY invoiceid;

SELECT
    BookingId,
    UserId,
    VehicleId,
    vehicletype,
    amount,
    bookingdate,
    timeslot,
    bookingstatus
FROM Booking
ORDER BY BookingId;

