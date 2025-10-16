-- Migration: Xóa các bảng BookingBatteryItem và BookingVehicleItem

-- Bước 1: Xóa foreign key constraints nếu có
ALTER TABLE BookingBatteryItem DROP CONSTRAINT IF EXISTS FKBookingBatteryItemBooking;
ALTER TABLE BookingBatteryItem DROP CONSTRAINT IF EXISTS FK_BookingBatteryItem_Booking;

ALTER TABLE BookingVehicleItem DROP CONSTRAINT IF EXISTS FKBookingVehicleItemBooking;
ALTER TABLE BookingVehicleItem DROP CONSTRAINT IF EXISTS FK_BookingVehicleItem_Booking;

-- Bước 2: Xóa hoàn toàn hai bảng
DROP TABLE IF EXISTS BookingBatteryItem CASCADE;
DROP TABLE IF EXISTS BookingVehicleItem CASCADE;

-- Lý do: Không cần các bảng này, chỉ hoạt động qua bảng Booking

