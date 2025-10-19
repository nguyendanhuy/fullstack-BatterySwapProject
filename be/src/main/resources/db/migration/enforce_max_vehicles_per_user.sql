-- Script xóa các booking không liên kết với invoiceId

-- Kiểm tra số lượng booking sẽ bị xóa trước
SELECT COUNT(*) as total_bookings_to_delete
FROM booking
WHERE invoiceid IS NULL;

-- Xóa các booking không có invoiceId
DELETE FROM booking
WHERE invoiceid IS NULL;

-- Kiểm tra kết quả sau khi xóa
SELECT COUNT(*) as remaining_bookings
FROM booking;