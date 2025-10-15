-- Xóa foreign keys
ALTER TABLE BookingBatteryItem DROP CONSTRAINT IF EXISTS FKBookingBatteryItemBooking;
ALTER TABLE BookingVehicleItem DROP CONSTRAINT IF EXISTS FKBookingVehicleItemBooking;

-- Xóa hai bảng
DROP TABLE IF EXISTS BookingBatteryItem CASCADE;
DROP TABLE IF EXISTS BookingVehicleItem CASCADE;