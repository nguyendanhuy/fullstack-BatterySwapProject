-- Thêm dữ liệu mẫu xe VinFast cho userId DR001

-- VinFast VF 5 (SUV cỡ A)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHCAMB1NE000001', 'LITHIUM_ION', true, 'VF_5', 'DR001');

-- VinFast VF 6 (SUV cỡ B)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHCAMB2NE000002', 'LITHIUM_ION', true, 'VF_6', 'DR001');

-- VinFast VF 7 (SUV cỡ C)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHCAMB3NE000003', 'LITHIUM_ION', true, 'VF_7', 'DR001');

-- VinFast VF 8 (SUV cỡ D)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHCAMB4NE000004', 'LITHIUM_ION', true, 'VF_8', 'DR001');

-- VinFast VF 9 (SUV cỡ E - lớn nhất)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHCAMB5NE000005', 'LITHIUM_ION', true, 'VF_9', 'DR001');

-- VinFast Theon (xe máy điện)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHTHEO1NE000006', 'LITHIUM_ION', true, 'THEON', 'DR001');

-- VinFast Feliz (xe máy điện phổ thông)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHFELI1NE000007', 'LITHIUM_ION', true, 'FELIZ', 'DR001');

-- VinFast Klara S (xe máy điện cao cấp)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHKLAR1NE000008', 'LITHIUM_ION', true, 'KLARA_S', 'DR001');

-- VinFast Klara A2 (phiên bản A2)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHKLAR2NE000009', 'LITHIUM_ION', true, 'KLARA_A2', 'DR001');

-- VinFast Tempest (xe máy điện thể thao)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHTEMP1NE000010', 'LITHIUM_ION', true, 'TEMPEST', 'DR001');

-- VinFast Vento (xe máy điện)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid)
VALUES ('LVSHVENT1NE000011', 'LITHIUM_ION', true, 'VENTO', 'DR001');


-- 11 XE ĐÃ ĐƯỢC GÁN CHO USER DR001 (Dữ liệu mới bạn cung cấp)
INSERT INTO vehicle (vin, batterytype, isactive, vehicletype, userid) VALUES
-- Ô tô điện
('LVSHCAMB1NE000001', 'LITHIUM_ION', true, 'VF_5', 'DR001'), -- VinFast VF 5

('LVSHCAMB2NE000002', 'LITHIUM_ION', true, 'VF_6', 'DR001'), -- VinFast VF 6

('LVSHCAMB3NE000003', 'LITHIUM_ION', true, 'VF_7', 'DR001'), -- VinFast VF 7

('LVSHCAMB4NE000004', 'LITHIUM_ION', true, 'VF_8', 'DR001'), -- VinFast VF 8

('LVSHCAMB5NE000005', 'LITHIUM_ION', true, 'VF_9', 'DR001'), -- VinFast VF 9
-- Xe máy điện
('LVSHTHEO1NE000006', 'LITHIUM_ION', true, 'THEON', 'DR001'), -- VinFast Theon

('LVSHFELI1NE000007', 'LITHIUM_ION', true, 'FELIZ', 'DR001'), -- VinFast Feliz

('LVSHKLAR1NE000008', 'LITHIUM_ION', true, 'KLARA_S', 'DR001'), -- VinFast Klara S

('LVSHKLAR2NE000009', 'LITHIUM_ION', true, 'KLARA_A2', 'DR001'), -- VinFast Klara A2

('LVSHTEMP1NE000010', 'LITHIUM_ION', true, 'TEMPEST', 'DR001'), -- VinFast Tempest

('LVSHVENT1NE000011', 'LITHIUM_ION', true, 'VENTO', 'DR001'); -- VinFast Vento


ALTER TABLE vehicle ALTER COLUMN batterytype DROP NOT NULL;
ALTER TABLE vehicle ALTER COLUMN vehicletype DROP NOT NULL;


-- Kiểm tra dữ liệu đã thêm
SELECT * FROM vehicle WHERE userid = 'DR001' ORDER BY vehicleid;