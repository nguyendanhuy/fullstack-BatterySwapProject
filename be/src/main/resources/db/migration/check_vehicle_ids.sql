-- Sửa booking ID 81 thành 09:30
UPDATE booking
SET "timeslot" = '16:30:00'
WHERE "bookingid" = 82;

-- Sửa booking ID 80 thành 14:00
UPDATE booking
SET "timeslot" = '14:00:00'
WHERE "bookingid" = 80;

-- Sửa booking ID 79 thành 15:30
UPDATE booking
SET "timeslot" = '15:30:00'
WHERE "bookingid" = 79;



/* * Script MỚI (VÀ CUỐI CÙNG) để reset bảng Invoice
 * Logic:
 * 1. Tính TỔNG CỘNG "amount" của các booking con
 * 2. Cập nhật "totalamount" của Invoice
 */
WITH InvoiceCalcs AS (
    SELECT
        b."invoiceid",
        -- Tính TỔNG CỘNG của cột "amount"
        COALESCE(SUM(b."amount"), 0) AS total_sum_amount,
        COUNT(b."bookingid") AS total_bookings
    FROM
        "booking" b
    WHERE
        b."invoiceid" IS NOT NULL
    GROUP BY
        b."invoiceid"
)
UPDATE "invoice" i
SET
    "totalamount" = ic.total_sum_amount,
    "numberofswaps" = ic.total_bookings
FROM
    InvoiceCalcs ic
WHERE
    i."invoiceid" = ic."invoiceid";

-- Set 0 cho các invoice không có booking
UPDATE "invoice"
SET
    "totalamount" = 0,
    "numberofswaps" = 0
WHERE "invoiceid" NOT IN (SELECT DISTINCT booking."invoiceid" FROM "booking" WHERE booking."invoiceid" IS NOT NULL);