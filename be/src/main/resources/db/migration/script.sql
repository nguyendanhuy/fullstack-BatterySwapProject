-- === BƯỚC 1: Thêm 3 MỨC GIÁ MỚI vào bảng SystemPrice ===
-- (Đã cập nhật tên 'pricetype' theo enum mới của bạn)

INSERT INTO "systemprice" (pricetype, price, description, createddate)
VALUES
    ('MONTHLY_SUBSCRIPTION_BASIC', 299000.0, 'Giá cho Gói Cơ bản (299k/tháng)', NOW()),
    ('MONTHLY_SUBSCRIPTION_PREMIUM', 499000.0, 'Giá cho Gói Premium (499k/tháng)', NOW()),
    ('MONTHLY_SUBSCRIPTION_UNLIMITED', 899000.0, 'Giá cho Gói Không giới hạn (899k/tháng)', NOW());


-- === BƯỚC 2: Thêm 3 GÓI (Plans) mới và liên kết với các giá ở trên ===
-- (Đã cập nhật tên 'pricetype' theo enum mới của bạn)



INSERT INTO "subscriptionplan" (planname, description, durationindays, pricetype, swaplimit)
VALUES
    (
        'Gói Cơ bản',
        'Phù hợp cho việc sử dụng hàng ngày',
        30,
        'MONTHLY_SUBSCRIPTION_BASIC', -- <-- ĐÃ SỬA
        10 -- Giới hạn 10 pin
    ),
    (
        'Gói Cao cấp',
        'Lựa chọn tốt nhất cho người dùng thường xuyên',
        30,
        'MONTHLY_SUBSCRIPTION_PREMIUM', -- <-- ĐÃ SỬA
        20 -- Giới hạn 20 pin
    ),
    (
        'Gói Không giới hạn',
        'Đổi pin không giới hạn',
        30,
        'MONTHLY_SUBSCRIPTION_UNLIMITED', -- <-- ĐÃ SỬA
        -1 -- -1 hoặc NULL nghĩa là không giới hạn
    );