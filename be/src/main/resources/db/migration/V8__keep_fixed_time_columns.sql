-- Migration: Khôi phục đúng cấu trúc Booking - GIỮ CÁC CỘT CỐ ĐỊNH, XÓA CÁC CỘT NANO GIÂY

-- Bước 1: Thêm lại các cột cố định (DATE, TIME, VARCHAR) nếu đã bị xóa
ALTER TABLE Booking ADD COLUMN IF NOT EXISTS bookingdate DATE;
ALTER TABLE Booking ADD COLUMN IF NOT EXISTS timeslot TIME;
ALTER TABLE Booking ADD COLUMN IF NOT EXISTS bookingstatus VARCHAR(20);

-- Bước 2: Migrate dữ liệu từ các cột nano giây (nếu có) về các cột cố định
-- Từ BookingTime -> bookingdate (lấy phần date)
UPDATE Booking
SET bookingdate = COALESCE(bookingdate, DATE(BookingTime), CURRENT_DATE)
WHERE bookingdate IS NULL;

-- Từ ScheduledTime -> timeslot (lấy phần time)
UPDATE Booking
SET timeslot = COALESCE(timeslot, TIME(ScheduledTime), '10:00:00'::TIME)
WHERE timeslot IS NULL;

-- Từ Status -> bookingstatus
UPDATE Booking
SET bookingstatus = COALESCE(bookingstatus, Status, 'PENDING')
WHERE bookingstatus IS NULL;

-- Bước 3: Đảm bảo tất cả giá trị hợp lệ
UPDATE Booking
SET bookingstatus = 'PENDING'
WHERE bookingstatus NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Bước 4: Thêm ràng buộc NOT NULL cho các cột cố định
ALTER TABLE Booking ALTER COLUMN bookingdate SET NOT NULL;
ALTER TABLE Booking ALTER COLUMN timeslot SET NOT NULL;
ALTER TABLE Booking ALTER COLUMN bookingstatus SET NOT NULL;

-- Bước 5: Xóa các cột có nano giây (TIMESTAMP)
ALTER TABLE Booking DROP COLUMN IF EXISTS BookingTime;
ALTER TABLE Booking DROP COLUMN IF EXISTS ScheduledTime;
ALTER TABLE Booking DROP COLUMN IF EXISTS Status;

-- Bước 6: Thêm constraint cho bookingstatus
ALTER TABLE Booking DROP CONSTRAINT IF EXISTS chk_booking_status;
ALTER TABLE Booking ADD CONSTRAINT chk_booking_status
    CHECK (bookingstatus IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));

-- Bước 7: Xử lý bảng Payment
ALTER TABLE Payment ADD COLUMN IF NOT EXISTS BookingId BIGINT;

-- Xóa payment không có BookingId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM Payment WHERE BookingId IS NULL) THEN
        DELETE FROM Payment WHERE BookingId IS NULL;
        RAISE NOTICE 'Deleted payments without BookingId';
    END IF;
END $$;

-- Thêm ràng buộc
ALTER TABLE Payment ALTER COLUMN BookingId SET NOT NULL;

-- Foreign key
ALTER TABLE Payment DROP CONSTRAINT IF EXISTS FKbub27lsqptj5xgl59srosnwjc;
ALTER TABLE Payment ADD CONSTRAINT FKbub27lsqptj5xgl59srosnwjc
    FOREIGN KEY (BookingId) REFERENCES Booking(BookingId);

-- Unique constraint
ALTER TABLE Payment DROP CONSTRAINT IF EXISTS UK32vafvo90opk181hofi7jdmwm;
ALTER TABLE Payment ADD CONSTRAINT UK32vafvo90opk181hofi7jdmwm UNIQUE (BookingId);

