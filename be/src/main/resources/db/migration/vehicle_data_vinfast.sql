-- Script với VIN chuẩn VinFast và tuân thủ validation nghiêm ngặt

-- Thêm cột BatteryCount nếu chưa tồn tại
ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS BatteryCount INTEGER DEFAULT 1;

-- Xóa toàn bộ dữ liệu trong bảng Vehicle
DELETE FROM Vehicle WHERE VehicleId > 0 OR VehicleId = 0;

-- Reset AUTO_INCREMENT
ALTER SEQUENCE vehicle_vehicleid_seq RESTART WITH 1;

-- Thêm dữ liệu xe máy điện VinFast với VIN chuẩn
INSERT INTO Vehicle (
    VIN,
    vehicleType,
    batteryType,
    isActive,
    ManufactureDate,
    PurchaseDate,
    LicensePlate,
    Color,
    BatteryCount
) VALUES
-- VinFast Theon (1 pin)
('LVVDB1107N1000001', 'THEON', 'LITHIUM_ION', false, '2023-01-15', '2023-02-01', '29A1-12345', 'Đỏ', 1),
('LVVDB1107N1000002', 'THEON', 'LITHIUM_ION', false, '2023-02-10', '2023-02-25', '29A1-12346', 'Xanh', 1),
('LVVDB1107N1000003', 'THEON', 'LITHIUM_ION', false, '2023-03-05', '2023-03-20', '29A1-12347', 'Trắng', 1),
('LVVDB1107N1000004', 'THEON', 'LITHIUM_ION', false, '2023-04-12', '2023-04-28', '29A1-12348', 'Đen', 1),
('LVVDB1107N1000005', 'THEON', 'LITHIUM_ION', false, '2023-05-08', '2023-05-22', '29A1-12349', 'Xám', 1),

-- VinFast Feliz (1 pin)
('LVVDB1207N1000001', 'FELIZ', 'LITHIUM_ION', false, '2023-01-20', '2023-02-05', '30B2-23456', 'Hồng', 1),
('LVVDB1207N1000002', 'FELIZ', 'LITHIUM_ION', false, '2023-02-15', '2023-03-01', '30B2-23457', 'Vàng', 1),
('LVVDB1207N1000003', 'FELIZ', 'LITHIUM_ION', false, '2023-03-10', '2023-03-25', '30B2-23458', 'Xanh lá', 1),
('LVVDB1207N1000004', 'FELIZ', 'LITHIUM_ION', false, '2023-04-18', '2023-05-03', '30B2-23459', 'Trắng', 1),
('LVVDB1207N1000005', 'FELIZ', 'LITHIUM_ION', false, '2023-05-14', '2023-05-28', '30B2-23460', 'Đỏ', 1),

-- VinFast Klara S (2 pin)
('LVVDB2107N1000001', 'KLARA_S', 'LITHIUM_ION', false, '2023-02-01', '2023-02-18', '31C3-34567', 'Đen', 2),
('LVVDB2107N1000002', 'KLARA_S', 'LITHIUM_ION', false, '2023-02-20', '2023-03-08', '31C3-34568', 'Trắng', 2),
('LVVDB2107N1000003', 'KLARA_S', 'LITHIUM_ION', false, '2023-03-15', '2023-04-01', '31C3-34569', 'Xanh', 2),
('LVVDB2107N1000004', 'KLARA_S', 'LITHIUM_ION', false, '2023-04-22', '2023-05-08', '31C3-34570', 'Đỏ', 2),
('LVVDB2107N1000005', 'KLARA_S', 'LITHIUM_ION', false, '2023-05-18', '2023-06-02', '31C3-34571', 'Xám', 2),

-- VinFast Klara A2 (2 pin)
('LVVDB2207N1000001', 'KLARA_A2', 'LITHIUM_ION', false, '2023-03-01', '2023-03-18', '32D4-45678', 'Xanh navy', 2),
('LVVDB2207N1000002', 'KLARA_A2', 'LITHIUM_ION', false, '2023-03-25', '2023-04-12', '32D4-45679', 'Bạc', 2),
('LVVDB2207N1000003', 'KLARA_A2', 'LITHIUM_ION', false, '2023-04-20', '2023-05-05', '32D4-45680', 'Đen', 2),
('LVVDB2207N1000004', 'KLARA_A2', 'LITHIUM_ION', false, '2023-05-28', '2023-06-12', '32D4-45681', 'Trắng', 2),
('LVVDB2207N1000005', 'KLARA_A2', 'LITHIUM_ION', false, '2023-06-15', '2023-06-30', '32D4-45682', 'Đỏ', 2),

-- VinFast Tempest (2 pin)
('LVVDB3107N1000001', 'TEMPEST', 'LITHIUM_ION', false, '2023-04-01', '2023-04-20', '33E5-56789', 'Đen mờ', 2),
('LVVDB3107N1000002', 'TEMPEST', 'LITHIUM_ION', false, '2023-04-28', '2023-05-15', '33E5-56790', 'Xanh điện', 2),
('LVVDB3107N1000003', 'TEMPEST', 'LITHIUM_ION', false, '2023-05-25', '2023-06-10', '33E5-56791', 'Cam', 2),
('LVVDB3107N1000004', 'TEMPEST', 'LITHIUM_ION', false, '2023-06-22', '2023-07-08', '33E5-56792', 'Tím', 2),
('LVVDB3107N1000005', 'TEMPEST', 'LITHIUM_ION', false, '2023-07-18', '2023-08-02', '33E5-56793', 'Vàng chanh', 2),

-- VinFast Vento (1 pin)
('LVVDB4107N1000001', 'VENTO', 'LITHIUM_ION', false, '2023-05-01', '2023-05-20', '34F6-67890', 'Xanh lá đậm', 1),
('LVVDB4107N1000002', 'VENTO', 'LITHIUM_ION', false, '2023-05-28', '2023-06-15', '34F6-67891', 'Nâu', 1),
('LVVDB4107N1000003', 'VENTO', 'LITHIUM_ION', false, '2023-06-25', '2023-07-12', '34F6-67892', 'Hồng pastel', 1),
('LVVDB4107N1000004', 'VENTO', 'LITHIUM_ION', false, '2023-07-22', '2023-08-08', '34F6-67893', 'Xám bạc', 1),
('LVVDB4107N1000005', 'VENTO', 'LITHIUM_ION', false, '2023-08-18', '2023-09-02', '34F6-67894', 'Trắng ngọc trai', 1);
