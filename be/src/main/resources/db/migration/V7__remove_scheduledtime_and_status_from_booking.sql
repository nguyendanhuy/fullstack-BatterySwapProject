ALTER TABLE booking DROP COLUMN scheduledtime;
ALTER TABLE booking DROP COLUMN bookingtime;
ALTER TABLE booking DROP COLUMN IF EXISTS Status;
-- Đảm bảo chỉ còn lại cột bookingstatus để quản lý trạng thái booking
-- Nếu cần, cập nhật lại các entity và repository liên quan để không còn tham chiếu đến các cột đã xóa

