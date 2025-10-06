package BatterySwapStation.service;

import BatterySwapStation.dto.BookingRequest;
import BatterySwapStation.dto.BookingResponse;
import BatterySwapStation.dto.CancelBookingRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final StationRepository stationRepository;

    @Transactional
    public BookingResponse createBooking(String userId, BookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        // Kiểm tra user đã có booking active chưa
        if (bookingRepository.existsActiveBookingForUser(user, LocalDateTime.now())) {
            throw new IllegalStateException("You already have an active booking. Please complete or cancel it first.");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with ID: " + request.getVehicleId()));

        // Kiểm tra xe có thuộc về user không
        if (vehicle.getUser() == null || !vehicle.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Vehicle does not belong to you.");
        }

        if (!vehicle.isActive()) {
            throw new IllegalStateException("Vehicle is not active.");
        }

        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new EntityNotFoundException("Station not found with ID: " + request.getStationId()));

        // Kiểm tra station có active không
        if (!station.isActive()) {
            throw new IllegalStateException("Station is not active.");
        }

        // Kiểm tra thời gian đặt (ít nhất 30 phút từ bây giờ)
        if (request.getScheduledTime().isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new IllegalArgumentException("Scheduled time must be at least 30 minutes from now.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setVehicle(vehicle);
        booking.setStation(station);
        booking.setScheduledTime(request.getScheduledTime());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setNotes(request.getNotes());

        booking = bookingRepository.save(booking);
        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        return bookingRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUpcomingBookings(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        return bookingRepository.findUpcomingBookingsByUser(user, LocalDateTime.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(String userId, int bookingId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        Booking booking = bookingRepository.findByBookingIdAndUser(bookingId, user)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found or does not belong to you."));

        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(String userId, int bookingId, CancelBookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        Booking booking = bookingRepository.findByBookingIdAndUser(bookingId, user)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found or does not belong to you."));

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed booking.");
        }

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled.");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(request.getCancellationReason());

        booking = bookingRepository.save(booking);
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse confirmBooking(int bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be confirmed.");
        }

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse completeBooking(int bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be completed.");
        }

        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedTime(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return mapToResponse(booking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setBookingId(booking.getBookingId());
        response.setUserId(booking.getUser().getUserId());
        response.setVehicleId(booking.getVehicle().getVehicleId());
        response.setVehicleVin(booking.getVehicle().getVIN());
        response.setStationId(booking.getStation().getStationId());
        response.setStationName(booking.getStation().getStationName());
        response.setBookingTime(booking.getBookingTime());
        response.setScheduledTime(booking.getScheduledTime());
        response.setStatus(booking.getStatus().name());
        response.setCompletedTime(booking.getCompletedTime());
        response.setCancellationReason(booking.getCancellationReason());
        response.setNotes(booking.getNotes());
        return response;
    }
}