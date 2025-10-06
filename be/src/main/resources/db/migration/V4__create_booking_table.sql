-- Create Booking table for PostgreSQL
CREATE TABLE IF NOT EXISTS Booking (
                                       BookingId SERIAL PRIMARY KEY,
                                       UserId VARCHAR(255) NOT NULL,
                                       VehicleId INT NOT NULL,
                                       StationId INT NOT NULL,
                                       BookingTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       ScheduledTime TIMESTAMP NOT NULL,
                                       Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                                       CompletedTime TIMESTAMP NULL,
                                       CancellationReason VARCHAR(500),
                                       Notes VARCHAR(1000),

                                       CONSTRAINT FK_Booking_User FOREIGN KEY (UserId) REFERENCES "users"("userid") ON DELETE CASCADE,
                                       CONSTRAINT FK_Booking_Vehicle FOREIGN KEY (VehicleId) REFERENCES "vehicle"("vehicleid") ON DELETE CASCADE,
                                       CONSTRAINT FK_Booking_Station FOREIGN KEY (StationId) REFERENCES "station"("stationid") ON DELETE CASCADE,
                                       CONSTRAINT chk_booking_status CHECK (Status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))
);

-- Create indexes
CREATE INDEX idx_booking_user ON Booking(UserId);
CREATE INDEX idx_booking_status ON Booking(Status);
CREATE INDEX idx_booking_scheduled_time ON Booking(ScheduledTime);



-- Dữ liệu mẫu cho bảng Booking
-- Giả sử bạn đã có Station với StationId từ 1-5

-- User DR004 (Nguyen Van A) đặt lịch với xe THEON
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, Notes)
VALUES
    ('DR004', 53, 1, '2025-10-05 09:00:00', 'CONFIRMED', 'Cần đổi pin gấp vào sáng sớm'),
    ('DR004', 55, 2, '2025-10-06 14:30:00', 'PENDING', 'Đặt trước cho chuyến đi xa');

-- User DR001 (user) đặt lịch với nhiều xe
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, Notes)
VALUES
    ('DR001', 18, 1, '2025-10-05 10:00:00', 'PENDING', 'Lần đầu sử dụng dịch vụ'),
    ('DR001', 49, 3, '2025-10-07 16:00:00', 'CONFIRMED', NULL);

-- User DR005 (karna linh) đặt lịch
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, Notes)
VALUES
    ('DR005', 15, 2, '2025-10-05 11:30:00', 'CONFIRMED', 'Xe VENTO - ưu tiên trạm gần nhà'),
    ('DR005', 15, 1, '2025-10-08 08:00:00', 'PENDING', 'Đặt trước cuối tuần');

-- User DR004 booking đã hoàn thành (lịch sử)
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, CompletedTime, Notes)
VALUES
    ('DR004', 53, 1, '2025-10-03 15:00:00', 'COMPLETED', '2025-10-03 15:25:00', 'Đã hoàn thành đúng hẹn'),
    ('DR004', 55, 2, '2025-10-02 10:30:00', 'COMPLETED', '2025-10-02 10:45:00', 'Dịch vụ tốt');

-- User DR001 booking đã hủy
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, CancellationReason)
VALUES
    ('DR001', 18, 3, '2025-10-04 13:00:00', 'CANCELLED', 'Thay đổi lịch trình đột xuất'),
    ('DR001', 49, 1, '2025-10-03 09:00:00', 'CANCELLED', 'Không còn nhu cầu sử dụng');

-- User DR005 - lịch đã hoàn thành và đã hủy
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, CompletedTime)
VALUES
    ('DR005', 15, 2, '2025-10-01 14:00:00', 'COMPLETED', '2025-10-01 14:20:00');

INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, CancellationReason)
VALUES
    ('DR005', 15, 3, '2025-10-02 11:00:00', 'CANCELLED', 'Trạm quá xa, chọn trạm khác');

-- Thêm một số booking cho các user khác
INSERT INTO Booking (UserId, VehicleId, StationId, ScheduledTime, Status, Notes)
VALUES
    ('DR002', 53, 1, '2025-10-06 09:30:00', 'PENDING', 'User DR002 - Xe VF_6'),
    ('DR003', 54, 2, '2025-10-06 15:00:00', 'CONFIRMED', 'User DR003 - Xe VF_7'),
    ('DR006', 57, 3, '2025-10-07 10:00:00', 'PENDING', 'User DR006 - Xe THEON');

-- Kiểm tra dữ liệu đã insert
SELECT
    b.BookingId,
    b.UserId,
    u.fullname AS UserName,
    b.VehicleId,
    v.vin AS VehicleVIN,
    v.vehicletype,
    b.StationId,
    b.ScheduledTime,
    b.Status,
    b.Notes
FROM Booking b
         JOIN users u ON b.UserId = u.userid
         JOIN vehicle v ON b.VehicleId = v.vehicleid
ORDER BY b.ScheduledTime DESC;