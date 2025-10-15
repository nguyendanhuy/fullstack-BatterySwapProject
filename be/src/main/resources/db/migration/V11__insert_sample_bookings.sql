-- Migration: Tạo dữ liệu mẫu cho bảng Booking

-- Ngày hiện tại: 2025-10-15
-- Booking phải trong vòng 7 ngày (từ 2025-10-15 đến 2025-10-22)

-- Bước 1: Tạo booking cho các user có xe (lấy từ bảng Vehicle)
-- Booking PENDING (đang chờ xác nhận)
INSERT INTO Booking (UserId, StationId, VehicleId, bookingdate, timeslot, bookingstatus, Notes)
SELECT
    v.UserId,
    1 as StationId, -- Station đầu tiên
    v.VehicleId,
    CURRENT_DATE + 1 as bookingdate, -- Ngày mai
    '09:00:00'::TIME as timeslot,
    'PENDING' as bookingstatus,
    'Booking tự động - Đặt lịch đổi pin sáng mai' as Notes
FROM Vehicle v
WHERE v.UserId IN (SELECT UserId FROM Users WHERE UserId LIKE 'DR%' LIMIT 1)
LIMIT 1;

-- Booking CONFIRMED (đã xác nhận) cho user khác
INSERT INTO Booking (UserId, StationId, VehicleId, bookingdate, timeslot, bookingstatus, Notes)
SELECT
    v.UserId,
    2 as StationId,
    v.VehicleId,
    CURRENT_DATE + 2 as bookingdate, -- 2 ngày sau
    '14:30:00'::TIME as timeslot,
    'CONFIRMED' as bookingstatus,
    'Booking đã xác nhận - Đổi pin chiều 2 ngày sau' as Notes
FROM Vehicle v
WHERE v.UserId IN (
    SELECT UserId FROM Users
    WHERE UserId LIKE 'DR%'
    AND UserId != (SELECT UserId FROM Vehicle LIMIT 1)
    LIMIT 1
)
LIMIT 1;

-- Booking COMPLETED (đã hoàn thành) - ngày hôm qua
INSERT INTO Booking (UserId, StationId, VehicleId, bookingdate, timeslot, bookingstatus, CompletedTime, Notes)
SELECT
    v.UserId,
    1 as StationId,
    v.VehicleId,
    CURRENT_DATE - 1 as bookingdate, -- Hôm qua
    '10:00:00'::TIME as timeslot,
    'COMPLETED' as bookingstatus,
    CURRENT_DATE as CompletedTime,
    'Booking đã hoàn thành - Đã đổi pin thành công' as Notes
FROM Vehicle v
WHERE v.UserId IN (SELECT UserId FROM Users WHERE UserId LIKE 'DR%' LIMIT 1 OFFSET 2)
LIMIT 1;

-- Booking CANCELLED (đã hủy)
INSERT INTO Booking (UserId, StationId, VehicleId, bookingdate, timeslot, bookingstatus, CancellationReason, Notes)
SELECT
    v.UserId,
    3 as StationId,
    v.VehicleId,
    CURRENT_DATE + 3 as bookingdate, -- 3 ngày sau
    '16:00:00'::TIME as timeslot,
    'CANCELLED' as bookingstatus,
    'Khách hàng hủy do thay đổi lịch trình' as CancellationReason,
    'Booking đã bị hủy' as Notes
FROM Vehicle v
WHERE v.UserId IN (SELECT UserId FROM Users WHERE UserId LIKE 'DR%' LIMIT 1 OFFSET 3)
LIMIT 1;

-- Thêm các booking khác với khung giờ khác nhau
INSERT INTO Booking (UserId, StationId, VehicleId, bookingdate, timeslot, bookingstatus, Notes)
SELECT
    v.UserId,
    (1 + (row_number() OVER ()) % 3)::INTEGER as StationId, -- Luân phiên station 1,2,3
    v.VehicleId,
    CURRENT_DATE + ((row_number() OVER ()) % 7)::INTEGER as bookingdate, -- Phân bổ trong 7 ngày - CAST VỀ INTEGER
    CASE (row_number() OVER ()) % 4
        WHEN 0 THEN '08:00:00'::TIME
        WHEN 1 THEN '11:30:00'::TIME
        WHEN 2 THEN '15:00:00'::TIME
        ELSE '18:30:00'::TIME
    END as timeslot,
    CASE (row_number() OVER ()) % 3
        WHEN 0 THEN 'PENDING'
        WHEN 1 THEN 'CONFIRMED'
        ELSE 'COMPLETED'
    END as bookingstatus,
    'Booking mẫu #' || (row_number() OVER ())::TEXT as Notes
FROM Vehicle v
WHERE v.UserId IN (SELECT UserId FROM Users WHERE UserId LIKE 'DR%')
AND v.VehicleId NOT IN (SELECT VehicleId FROM Booking) -- Chỉ lấy xe chưa có booking
LIMIT 10;

-- Bước 2: Hiển thị tổng số booking đã tạo
DO $$
DECLARE
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_count FROM Booking;
    RAISE NOTICE 'Đã tạo thành công % booking mẫu', booking_count;
END $$;
