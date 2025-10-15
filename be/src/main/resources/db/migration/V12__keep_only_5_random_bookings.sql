-- Migration: Xóa ngẫu nhiên dữ liệu Booking, chỉ giữ lại 5 dòng

-- Bước 1: Tạo bảng tạm để lưu 5 booking ngẫu nhiên cần giữ lại
CREATE TEMP TABLE bookings_to_keep AS
SELECT BookingId
FROM Booking
ORDER BY RANDOM()
LIMIT 5;

-- Bước 2: Xóa tất cả booking KHÔNG nằm trong danh sách giữ lại
DELETE FROM Booking
WHERE BookingId NOT IN (SELECT BookingId FROM bookings_to_keep);

-- Bước 3: Hiển thị số lượng booking còn lại
DO $$
DECLARE
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_count FROM Booking;
    RAISE NOTICE 'Còn lại % booking trong database', booking_count;
END $$;

