package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking API", description = "API quản lý đặt chỗ thay pin")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Tạo booking mới", description = "Tạo một booking mới cho việc thay pin")
    public ResponseEntity<ApiResponseDto> createBooking(
            @RequestBody BookingRequest request) {
        try {
            BookingResponse response = bookingService.createBooking(request);
            return ResponseEntity.ok(new ApiResponseDto(true, "Booking created successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to create booking: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy danh sách booking của user", description = "Lấy tất cả booking của một user cụ thể")
    public ResponseEntity<ApiResponseDto> getUserBookings(
            @PathVariable @Parameter(description = "ID của user") String userId) {
        try {
            List<BookingResponse> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(new ApiResponseDto(true, "User bookings retrieved successfully", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to get user bookings: " + e.getMessage()));
        }
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Lấy thông tin booking theo ID", description = "Lấy chi tiết một booking cụ thể")
    public ResponseEntity<ApiResponseDto> getBookingById(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "ID của user") String userId) {
        try {
            BookingResponse booking = bookingService.getBookingById(bookingId, userId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Booking retrieved successfully", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to get booking: " + e.getMessage()));
        }
    }

    @PutMapping("/cancel")
    @Operation(summary = "Hủy booking", description = "Hủy một booking đã tạo")
    public ResponseEntity<ApiResponseDto> cancelBooking(
            @RequestBody CancelBookingRequest request) {
        try {
            BookingResponse response = bookingService.cancelBooking(request);
            return ResponseEntity.ok(new ApiResponseDto(true, "Booking cancelled successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to cancel booking: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Lấy booking theo trạng thái", description = "Lấy danh sách booking theo trạng thái cụ thể")
    public ResponseEntity<ApiResponseDto> getBookingsByStatus(
            @PathVariable @Parameter(description = "Trạng thái booking (PENDING, CONFIRMED, CANCELLED, COMPLETED)")
            String status) {
        try {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            List<BookingResponse> bookings = bookingService.getBookingsByStatus(bookingStatus);
            return ResponseEntity.ok(new ApiResponseDto(true, "Bookings retrieved successfully", bookings));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Invalid booking status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to get bookings: " + e.getMessage()));
        }
    }

    @GetMapping("/station/{stationId}")
    @Operation(summary = "Lấy booking của station", description = "Lấy tất cả booking của một station cụ thể")
    public ResponseEntity<ApiResponseDto> getStationBookings(
            @PathVariable @Parameter(description = "ID của station") Integer stationId) {
        try {
            List<BookingResponse> bookings = bookingService.getStationBookings(stationId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Station bookings retrieved successfully", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to get station bookings: " + e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/status")
    @Operation(summary = "Cập nhật trạng thái booking", description = "Cập nhật trạng thái của một booking (dành cho admin/staff)")
    public ResponseEntity<ApiResponseDto> updateBookingStatus(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "Trạng thái mới") String status) {
        try {
            Booking.BookingStatus newStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            BookingResponse response = bookingService.updateBookingStatus(bookingId, newStatus);
            return ResponseEntity.ok(new ApiResponseDto(true, "Booking status updated successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Invalid booking status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to update booking status: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả booking", description = "Lấy danh sách tất cả booking (dành cho admin)")
    public ResponseEntity<ApiResponseDto> getAllBookings() {
        try {
            List<BookingResponse> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(new ApiResponseDto(true, "All bookings retrieved successfully", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Failed to get all bookings: " + e.getMessage()));
        }
    }
}
