-- Script SQL để cập nhật bảng SystemPrice theo entity
-- Chạy trực tiếp trong PostgreSQL

-- 1. Drop bảng cũ
DROP TABLE IF EXISTS SystemPrice;

-- 2. Tạo lại bảng theo entity SystemPrice.java (PostgreSQL syntax)
CREATE TABLE SystemPrice (
    Id BIGSERIAL PRIMARY KEY,
    Price DOUBLE PRECISION NOT NULL DEFAULT 15000.0,
    Description VARCHAR(500) DEFAULT 'Giá mặc định cho mỗi lượt đổi pin',
    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP NULL
);

-- 3. Insert dữ liệu mặc định
INSERT INTO SystemPrice (Price, Description, CreatedDate)
VALUES (15000.0, 'Giá mặc định khởi tạo hệ thống - áp dụng cho tất cả loại pin và lượt đổi pin', CURRENT_TIMESTAMP);

-- 4. Verify
SELECT * FROM SystemPrice;
