-- Script tạo 5 booking mẫu cho bảng Booking
-- Cần đảm bảo đã có User và Station trong database trước khi chạy script này

-- 4. Insert 5 booking mẫu với đầy đủ cột bắt buộc
INSERT INTO booking(userid, stationid, scheduledtime, bookingdate, timeslot, bookingstatus)
SELECT userid, stationid, scheduledtime, bookingdate, timeslot, bookingstatus
FROM (VALUES
  -- Booking 1: Pending
  ('DR001', 1, '2025-10-10 09:00:00'::timestamp, '2025-10-10'::date, '09:00:00'::time, 'PENDING'),

  -- Booking 2: Confirmed
  ('DR002', 1, '2025-10-10 10:30:00'::timestamp, '2025-10-10'::date, '10:30:00'::time, 'CONFIRMED'),

  -- Booking 3: Pending
  ('DR003', 2, '2025-10-11 14:00:00'::timestamp, '2025-10-11'::date, '14:00:00'::time, 'PENDING'),

  -- Booking 4: Completed
  ('DR004', 2, '2025-10-09 16:30:00'::timestamp, '2025-10-09'::date, '16:30:00'::time, 'COMPLETED'),

  -- Booking 5: Cancelled
  ('DR005', 3, '2025-10-12 11:15:00'::timestamp, '2025-10-12'::date, '11:15:00'::time, 'CANCELLED')
) AS booking_data(userid, stationid, scheduledtime, bookingdate, timeslot, bookingstatus)
WHERE EXISTS (SELECT 1 FROM users u WHERE u.userid = booking_data.userid)
  AND EXISTS (SELECT 1 FROM station s WHERE s.stationid = booking_data.stationid);
