package BatterySwapStation.dto;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Vehicle;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class BookingSimpleDto {
    private Long bookingId;
    private LocalDate bookingDate;
    private LocalTime timeSlot;
    private Booking.BookingStatus bookingStatus;
    private Double amount;
    private Double totalPrice;

    private Integer stationId;
    private String stationName;
    private String stationAddress;

    private Integer vehicleId;
    private String vehicleVin;
    private Vehicle.VehicleType vehicleType;  // ⚠️ sửa kiểu này từ String → VehicleType
    private String licensePlate;

    private Long invoiceId;
    private Double totalAmount;
    private Invoice.InvoiceStatus invoiceStatus;
    private LocalDateTime invoiceCreatedDate;

    // ⚡ Thêm constructor chuẩn để JPA match chính xác
    public BookingSimpleDto(
            Long bookingId,
            LocalDate bookingDate,
            LocalTime timeSlot,
            Booking.BookingStatus bookingStatus,
            Double amount,
            Double totalPrice,
            Integer stationId,
            String stationName,
            String stationAddress,
            Integer vehicleId,
            String vehicleVin,
            Vehicle.VehicleType vehicleType,   // ⚠️ trùng enum entity
            String licensePlate,
            Long invoiceId,
            Double totalAmount,
            Invoice.InvoiceStatus invoiceStatus,
            LocalDateTime invoiceCreatedDate
    ) {
        this.bookingId = bookingId;
        this.bookingDate = bookingDate;
        this.timeSlot = timeSlot;
        this.bookingStatus = bookingStatus;
        this.amount = amount;
        this.totalPrice = totalPrice;
        this.stationId = stationId;
        this.stationName = stationName;
        this.stationAddress = stationAddress;
        this.vehicleId = vehicleId;
        this.vehicleVin = vehicleVin;
        this.vehicleType = vehicleType;
        this.licensePlate = licensePlate;
        this.invoiceId = invoiceId;
        this.totalAmount = totalAmount;
        this.invoiceStatus = invoiceStatus;
        this.invoiceCreatedDate = invoiceCreatedDate;
    }
}
