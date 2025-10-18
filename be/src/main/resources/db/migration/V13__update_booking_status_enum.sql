-- V13: Cập nhật enum BookingStatus để loại bỏ CONFIRMED và đảm bảo consistency
-- Flow mới: PENDINGPAYMENT -> PENDINGSWAPPING -> COMPLETED

-- 1. Cập nhật tất cả booking có status CONFIRMED thành PENDINGSWAPPING
UPDATE Booking
SET bookingstatus = 'PENDINGSWAPPING'
WHERE bookingstatus = 'CONFIRMED';

-- 2. Cập nhật constraint check để chỉ cho phép các status hợp lệ
ALTER TABLE Booking DROP CONSTRAINT IF EXISTS chk_booking_status;

-- 3. Thêm constraint mới với các status được phép
ALTER TABLE Booking
ADD CONSTRAINT chk_booking_status
CHECK (bookingstatus IN ('PENDINGPAYMENT', 'PENDINGSWAPPING', 'CANCELLED', 'COMPLETED'));

-- 4. Cập nhật default value cho bookingstatus
ALTER TABLE Booking
ALTER COLUMN bookingstatus SET DEFAULT 'PENDINGPAYMENT';

-- 5. Đảm bảo không có null values
UPDATE Booking
SET bookingstatus = 'PENDINGPAYMENT'
WHERE bookingstatus IS NULL;

-- 6. Thêm NOT NULL constraint nếu chưa có
ALTER TABLE Booking
ALTER COLUMN bookingstatus SET NOT NULL;

-- 7. Tạo index để tối ưu query theo status
CREATE INDEX IF NOT EXISTS idx_booking_status
ON Booking(bookingstatus);

-- 8. Tạo index composite cho các query thường dùng
CREATE INDEX IF NOT EXISTS idx_booking_user_status_date
ON Booking(UserId, bookingstatus, bookingdate);

CREATE INDEX IF NOT EXISTS idx_booking_station_date_status
ON Booking(StationId, bookingdate, bookingstatus);

-- 9. Comment để ghi lại thay đổi
COMMENT ON COLUMN Booking.bookingstatus IS 'Trạng thái booking: PENDINGPAYMENT (chờ thanh toán), PENDINGSWAPPING (chờ đổi pin), CANCELLED (đã hủy), COMPLETED (hoàn thành)';

-- 10. Hiển thị thống kê sau khi update
SELECT
    bookingstatus,
    COUNT(*) as total_bookings,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM Booking
GROUP BY bookingstatus
ORDER BY total_bookings DESC;
