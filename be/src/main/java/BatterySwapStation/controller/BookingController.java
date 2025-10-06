package BatterySwapStation.controller;

import BatterySwapStation.dto.BookingRequest;
import BatterySwapStation.dto.BookingResponse;
import BatterySwapStation.dto.CancelBookingRequest;
import BatterySwapStation.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "APIs for battery swap booking")
@SecurityRequirement(name = "bearer-jwt")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create a new booking", description = "Create a battery swap booking for a vehicle")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingRequest request) {

        String userId = userDetails.getUsername();
        BookingResponse response = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all user bookings", description = "Get all bookings of the current user")
    public ResponseEntity<List<BookingResponse>> getUserBookings(
  //          @RequestParam String userId) {  // ← Đổi thành @RequestParam
            @AuthenticationPrincipal UserDetails userDetails) {

        String userId = userDetails.getUsername();
        List<BookingResponse> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming bookings", description = "Get upcoming bookings of the current user")
    public ResponseEntity<List<BookingResponse>> getUpcomingBookings(
            @AuthenticationPrincipal UserDetails userDetails) {

        String userId = userDetails.getUsername();
        List<BookingResponse> bookings = bookingService.getUpcomingBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get booking by ID", description = "Get a booking by its ID")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable int bookingId,
            @RequestParam String userId) {
        BookingResponse booking = bookingService.getBookingById(userId, bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/cancel")
    @Operation(summary = "Cancel a booking", description = "Cancel a pending or confirmed booking")
    public ResponseEntity<BookingResponse> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable int bookingId,
            @Valid @RequestBody CancelBookingRequest request) {

        String userId = userDetails.getUsername();
        BookingResponse response = bookingService.cancelBooking(userId, bookingId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{bookingId}/confirm")
    @Operation(summary = "Confirm a booking", description = "Confirm a pending booking (Admin/Staff only)")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable int bookingId) {
        BookingResponse response = bookingService.confirmBooking(bookingId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{bookingId}/complete")
    @Operation(summary = "Complete a booking", description = "Mark a confirmed booking as completed (Admin/Staff only)")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable int bookingId) {
        BookingResponse response = bookingService.completeBooking(bookingId);
        return ResponseEntity.ok(response);
    }
}