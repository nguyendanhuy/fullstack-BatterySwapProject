-- Drop và tạo lại bảng SystemPrice dựa theo entity SystemPrice.java
-- Cấu trúc: id, price, description, createdDate, updatedDate

-- Drop bảng cũ nếu tồn tại
DROP TABLE IF EXISTS SystemPrice;

-- Tạo lại bảng SystemPrice theo entity
CREATE TABLE SystemPrice (
    Id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID tự tăng',
    Price DOUBLE NOT NULL DEFAULT 15000.0 COMMENT 'Giá cho mỗi lượt đổi pin (VND)',
    Description VARCHAR(500) DEFAULT 'Giá mặc định cho mỗi lượt đổi pin' COMMENT 'Mô tả về giá',
    CreatedDate DATETIME NOT NULL COMMENT 'Ngày tạo - tự động set khi tạo',
    UpdatedDate DATETIME NULL COMMENT 'Ngày cập nhật cuối - tự động set khi update'
) COMMENT = 'Bảng quản lý giá hệ thống - quy luật chung cho toàn dự án';

-- Insert dữ liệu mặc định
INSERT INTO SystemPrice (Price, Description, CreatedDate)
VALUES (
    15000.0,
    'Giá mặc định khởi tạo hệ thống - áp dụng cho tất cả loại pin và lượt đổi pin',
    NOW()
);

-- Tạo index cho performance
CREATE INDEX idx_systemprice_created_date ON SystemPrice(CreatedDate DESC);

-- Verify dữ liệu đã insert
SELECT * FROM SystemPrice;

-- Show table structure
DESCRIBE SystemPrice;
