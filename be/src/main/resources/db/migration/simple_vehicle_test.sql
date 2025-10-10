-- Cập nhật ownername cho các xe theo vehicleId
UPDATE Vehicle SET ownername = 'John Cena' WHERE vehicleId = 2;
UPDATE Vehicle SET ownername = 'Vladimir Putin' WHERE vehicleId = 3;
UPDATE Vehicle SET ownername = 'Donald Trump' WHERE vehicleId = 5;
UPDATE Vehicle SET ownername = 'Tran Dan' WHERE vehicleId = 10;
UPDATE Vehicle SET ownername = 'Tao' WHERE vehicleId IN (1, 4, 6, 7, 8, 9);

-- Nếu muốn cập nhật thêm, chỉ cần thêm dòng:
-- UPDATE Vehicle SET ownername = 'Tên mới' WHERE vehicleId = X;
