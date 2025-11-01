-- =====================================


-- =====================================
-- QUERY CỤ THỂ CHO PIN BAT189
-- =====================================

-- 15. XEM TẤT CẢ INSPECTION CỦA PIN BAT189
SELECT
    bi.id,
    bi.bookingid,
    bi.batteryid,
    bi.staffid,
    bi.inspectiontime,
    bi.stateofhealth,
    bi.physicalnotes,
    bi.isdamaged,
    bi.status,
    b.batterystatus as current_battery_status
FROM batteryinspection bi
LEFT JOIN battery b ON bi.batteryid = b.batteryid
WHERE bi.batteryid = 'BAT189'
ORDER BY bi.inspectiontime DESC;

-- 16. CẬP NHẬT STATE OF HEALTH CHO PIN BAT189
UPDATE batteryinspection
SET stateofhealth = 85.0  -- Thay đổi giá trị này
WHERE batteryid = 'BAT189' AND id = 1;  -- Thay đổi ID inspection cụ thể

-- 17. CẬP NHẬT STATUS CHO PIN BAT189
UPDATE batteryinspection
SET status = 'PASS'  -- Hoặc 'IN_MAINTENANCE'
WHERE batteryid = 'BAT189' AND id = 1;  -- Thay đổi ID inspection cụ thể

-- 18. CẬP NHẬT PHYSICAL NOTES CHO PIN BAT189
UPDATE batteryinspection
SET physicalnotes = 'Pin BAT189 hoạt động bình thường'
WHERE batteryid = 'BAT189' AND id = 1;  -- Thay đổi ID inspection cụ thể

-- 19. CẬP NHẬT TẤT CẢ THÔNG TIN CHO PIN BAT189
UPDATE batteryinspection
SET
    stateofhealth = 85.0,
    physicalnotes = 'Pin BAT189 đã được kiểm tra và hoạt động tốt',
    status = 'PASS',
    isdamaged = false
WHERE batteryid = 'BAT189' AND id = 1;  -- Thay đổi ID inspection cụ thể

-- 20. CẬP NHẬT TẤT CẢ INSPECTION CỦA PIN BAT189 THÀNH IN_MAINTENANCE
UPDATE batteryinspection
SET status = 'IN_MAINTENANCE'
WHERE batteryid = 'BAT189';

-- 21. ĐỒNG BỘ TRẠNG THÁI PIN BAT189 VỚI INSPECTION MỚI NHẤT
UPDATE battery
SET batterystatus = CASE
    WHEN (SELECT bi.status FROM batteryinspection bi
          WHERE bi.batteryid = 'BAT189'
          ORDER BY bi.inspectiontime DESC LIMIT 1) = 'IN_MAINTENANCE'
    THEN 'MAINTENANCE'
    ELSE 'AVAILABLE'
END
WHERE batteryid = 'BAT189';

-- 22. CẬP NHẬT STATE OF HEALTH CHO PIN BAT189 DỰA TRÊN INSPECTION MỚI NHẤT
UPDATE battery
SET stateofhealth = (
    SELECT bi.stateofhealth
    FROM batteryinspection bi
    WHERE bi.batteryid = 'BAT189'
    ORDER BY bi.inspectiontime DESC
    LIMIT 1
)
WHERE batteryid = 'BAT189';

-- 23. XEM TRẠNG THÁI HIỆN TẠI CỦA PIN BAT189
SELECT
    b.batteryid,
    b.batterystatus,
    b.stateofhealth as battery_stateofhealth,
    bi.status as latest_inspection_status,
    bi.stateofhealth as latest_inspection_stateofhealth,
    bi.inspectiontime as latest_inspection_time
FROM battery b
LEFT JOIN batteryinspection bi ON b.batteryid = bi.batteryid
WHERE b.batteryid = 'BAT189'
ORDER BY bi.inspectiontime DESC
LIMIT 1;
