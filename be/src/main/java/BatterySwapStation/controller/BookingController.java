package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.service.BookingService;
import BatterySwapStation.service.InvoiceService;
import BatterySwapStation.service.SystemPriceService;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.dto.BookingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking API", description = "API quản lý đặt chỗ thay pin")
public class BookingController {

    private final BookingService bookingService;
    private final InvoiceService invoiceService;
    private final BookingRepository bookingRepository;
    private final SystemPriceService systemPriceService; // Thêm SystemPriceService

    @PostMapping
    @Operation(summary = "Tạo booking mới", description = "Tạo một booking mới cho việc thay pin")
    public ResponseEntity<ApiResponseDto> createBooking(
            @RequestBody BookingRequest request) {
        try {
            BookingResponse response = bookingService.createBooking(request);
            return ResponseEntity.ok(new ApiResponseDto(true, "Booking thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Booking thất bại: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy danh sách booking của user", description = "Lấy tất cả booking của một user cụ thể")
    public ResponseEntity<ApiResponseDto> getUserBookings(
            @PathVariable @Parameter(description = "ID của user") String userId) {
        try {
            List<BookingResponse> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Lấy danh sách booking thành công!", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi lấy danh sách booking: " + e.getMessage()));
        }
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Lấy thông tin booking theo ID", description = "Lấy chi tiết một booking cụ thể")
    public ResponseEntity<ApiResponseDto> getBookingById(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "ID của user") String userId) {
        try {
            BookingResponse booking = bookingService.getBookingById(bookingId, userId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Lấy danh sách booking thành công!", booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi lấy danh sách booking: " + e.getMessage()));
        }
    }

    @PutMapping("/cancel")
    @Operation(summary = "Hủy booking", description = "Hủy một booking đã tạo")
    public ResponseEntity<ApiResponseDto> cancelBooking(
            @RequestBody CancelBookingRequest request) {
        try {
            BookingResponse response = bookingService.cancelBooking(request);
            return ResponseEntity.ok(new ApiResponseDto(true, "Hủy booking thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi hủy booking: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Lấy booking theo trạng thái", description = "Lấy danh sách booking theo trạng thái cụ thể (PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED)")
    public ResponseEntity<ApiResponseDto> getBookingsByStatus(
            @PathVariable @Parameter(description = "Trạng thái booking (PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED)")
            String status) {
        try {
            // Validate status trước khi gọi service
            String normalizedStatus = status.toUpperCase();
            if (!normalizedStatus.matches("PENDINGPAYMENT|PENDINGSWAPPING|CANCELLED|COMPLETED")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponseDto(false, "Trạng thái không hợp lệ. Chỉ chấp nhận: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED"));
            }

            List<BookingResponse> bookings = bookingService.getBookingsByStatus(normalizedStatus);
            return ResponseEntity.ok(new ApiResponseDto(true, "Lấy danh sách booking thành công!", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi lấy danh sách booking: " + e.getMessage()));
        }
    }

    @GetMapping("/station/{stationId}")
    @Operation(summary = "Lấy booking của station", description = "Lấy tất cả booking của một station cụ thể")
    public ResponseEntity<ApiResponseDto> getStationBookings(
            @PathVariable @Parameter(description = "ID của station") Integer stationId) {
        try {
            List<BookingResponse> bookings = bookingService.getStationBookings(stationId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Lấy danh sách booking thành công!", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi lấy danh sách booking: " + e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/status")
    @Operation(summary = "Cập nhật trạng thái booking", description = "Cập nhật trạng thái của một booking (dành cho admin/staff). Trạng thái: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED, FAILED")
    public ResponseEntity<ApiResponseDto> updateBookingStatus(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "Trạng thái mới (PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED, FAILED)") String status) {
        try {
            // Validate và normalize status
            String normalizedStatus = status.toUpperCase();
            if (!normalizedStatus.matches("PENDINGPAYMENT|PENDINGSWAPPING|CANCELLED|COMPLETED|FAILED")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponseDto(false, "Trạng thái không hợp lệ. Chỉ chấp nhận: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED, FAILED"));
            }

            BookingResponse response = bookingService.updateBookingStatus(bookingId, normalizedStatus);
            return ResponseEntity.ok(new ApiResponseDto(true, "Cập nhật trạng thái booking thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Cập nhật trạng thái booking thất bại: " + e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/fail")
    @Operation(summary = "Chuyển trạng thái booking sang FAILED", description = "Cập nhật trạng thái của booking từ PENDINGPAYMENT sang FAILED trong trường hợp thanh toán thất bại")
    public ResponseEntity<ApiResponseDto> markBookingAsFailed(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId) {
        try {
            BookingResponse response = bookingService.markBookingAsFailed(bookingId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Chuyển trạng thái booking sang FAILED thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Chuyển trạng thái booking sang FAILED thất bại: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả booking", description = "Lấy danh sách tất cả booking (dành cho admin)")
    public ResponseEntity<ApiResponseDto> getAllBookings() {
        try {
            List<BookingResponse> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(new ApiResponseDto(true, "Lấy tất cả booking thành công!", bookings));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi lấy booking: " + e.getMessage()));
        }
    }

    @PostMapping("/createinvoice")
    @Operation(summary = "Tạo invoice và bookings từ danh sách xe", description = "Tạo invoice và bookings cho từng xe được chọn, tự động lấy userId từ xe")
    public ResponseEntity<Map<String, Object>> createInvoiceFromVehicles(
            @RequestBody List<Map<String, Object>> vehicleBatteryData) {
        try {
            // Delegate toàn bộ luồng tách, tính tiền và lưu vào service transactional
            java.util.Map<String, Object> result = bookingService.createInvoiceFromVehicles(vehicleBatteryData);
            return ResponseEntity.status(201).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Tạo invoice và bookings thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    // Helper methods để parse ID
    private Integer parseVehicleId(Object vehicleIdObj) {
        if (vehicleIdObj instanceof Integer) {
            return (Integer) vehicleIdObj;
        } else if (vehicleIdObj instanceof String) {
            String vehicleIdStr = (String) vehicleIdObj;
            // Nếu là số thuần túy
            if (vehicleIdStr.matches("\\d+")) {
                return Integer.valueOf(vehicleIdStr);
            }
            // Nếu có chữ và số như "THEON001", "VEHICLE_1"
            if (vehicleIdStr.matches(".*\\d+.*")) {
                return Integer.valueOf(vehicleIdStr.replaceAll("[^0-9]", ""));
            }
            throw new RuntimeException("Không thể parse vehicleId từ: " + vehicleIdStr);
        } else {
            throw new RuntimeException("vehicleId phải là String hoặc Integer, nhận được: " + vehicleIdObj.getClass().getSimpleName());
        }
    }

    private Integer parseStationId(Object stationIdObj) {
        if (stationIdObj instanceof Integer) {
            return (Integer) stationIdObj;
        } else if (stationIdObj instanceof String) {
            String stationIdStr = (String) stationIdObj;
            // Nếu là số thuần túy
            if (stationIdStr.matches("\\d+")) {
                return Integer.valueOf(stationIdStr);
            }
            // Nếu có chữ và số như "ST01", "STATION_1"
            if (stationIdStr.matches(".*\\d+.*")) {
                return Integer.valueOf(stationIdStr.replaceAll("[^0-9]", ""));
            }
            throw new RuntimeException("Không thể parse stationId từ: " + stationIdStr);
        } else {
            throw new RuntimeException("stationId phải là String hoặc Integer, nhận được: " + stationIdObj.getClass().getSimpleName());
        }
    }

    @PatchMapping("/{bookingId}/schedule")
    @Operation(summary = "Cập nhật lịch trình cho booking", description = "Cập nhật ngày giờ cho booking đã tạo")
    public ResponseEntity<Map<String, Object>> updateBookingSchedule(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "Ngày sử dụng (yyyy-MM-dd)") String date,
            @RequestParam @Parameter(description = "Giờ sử dụng (HH:mm)") String time) {
        try {
            // Lấy booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));

            // Cập nhật ngày giờ
            booking.setBookingDate(java.time.LocalDate.parse(date));
            booking.setTimeSlot(java.time.LocalTime.parse(time));

            // Lưu booking
            Booking savedBooking = bookingRepository.save(booking);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật lịch trình thành công",
                    "bookingId", savedBooking.getBookingId(),
                    "date", savedBooking.getBookingDate().toString(),
                    "time", savedBooking.getTimeSlot().toString(),
                    "status", savedBooking.getBookingStatus().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cập nhật lịch trình thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/batch-schedule")
    @Operation(summary = "Cập nhật lịch trình cho nhiều booking", description = "Cập nhật ngày giờ cho nhiều booking cùng lúc")
    public ResponseEntity<Map<String, Object>> updateMultipleBookingSchedules(
            @RequestBody List<Map<String, Object>> scheduleData) {
        try {
            List<Map<String, Object>> results = new ArrayList<>();

            for (Map<String, Object> schedule : scheduleData) {
                Long bookingId = Long.valueOf(schedule.get("bookingId").toString());
                String date = (String) schedule.get("date");
                String time = (String) schedule.get("time");

                try {
                    Booking booking = bookingRepository.findById(bookingId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

                    booking.setBookingDate(java.time.LocalDate.parse(date));
                    booking.setTimeSlot(java.time.LocalTime.parse(time));

                    Booking savedBooking = bookingRepository.save(booking);

                    results.add(Map.of(
                            "bookingId", savedBooking.getBookingId(),
                            "success", true,
                            "date", savedBooking.getBookingDate().toString(),
                            "time", savedBooking.getTimeSlot().toString()
                    ));
                } catch (Exception e) {
                    results.add(Map.of(
                            "bookingId", bookingId,
                            "success", false,
                            "error", e.getMessage()
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật lịch trình cho " + scheduleData.size() + " booking",
                    "results", results
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cập nhật lịch trình thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/vehicles/user/{userId}")
    @Operation(summary = "Lấy danh sách xe của user", description = "Lấy tất cả xe thuộc về một user cụ thể")
    public ResponseEntity<Map<String, Object>> getUserVehicles(
            @PathVariable @Parameter(description = "ID của user") String userId) {
        try {
            // Lấy danh sách xe từ VehicleRepository thông qua BookingService
            List<Map<String, Object>> vehicles = bookingService.getUserVehicles(userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "vehicles", vehicles,
                    "total", vehicles.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Lỗi lấy danh sách xe",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/vehicles/{vehicleId}")
    @Operation(summary = "Lấy thông tin chi tiết xe", description = "Lấy thông tin chi tiết của một xe theo vehicleId")
    public ResponseEntity<Map<String, Object>> getVehicleDetail(
            @PathVariable @Parameter(description = "ID của xe") Integer vehicleId) {
        try {
            Map<String, Object> vehicleDetail = bookingService.getVehicleDetail(vehicleId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "vehicle", vehicleDetail
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Không tìm thấy xe",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/vehicles/validate/{vehicleId}")
    @Operation(summary = "Kiểm tra xe có thể booking", description = "Kiểm tra xe có tồn tại và có thể đặt lịch không")
    public ResponseEntity<Map<String, Object>> validateVehicleForBooking(
            @PathVariable @Parameter(description = "ID của xe") Integer vehicleId,
            @RequestParam @Parameter(description = "ID của user") String userId) {
        try {
            boolean isValid = bookingService.validateVehicleForBooking(vehicleId, userId);
            Map<String, Object> vehicleInfo = bookingService.getVehicleDetail(vehicleId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "isValid", isValid,
                    "vehicleId", vehicleId,
                    "vehicle", vehicleInfo,
                    "message", isValid ? "Xe có thể đặt lịch" : "Xe không thể đặt lịch"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "isValid", false,
                    "error", "Lỗi kiểm tra xe",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/quick-book")
    @Operation(summary = "Tạo booking nhanh", description = "Tạo booking nhanh với vehicleId, stationId và thông tin cơ bản, tự động lấy userId từ xe")
    public ResponseEntity<Map<String, Object>> quickBooking(
            @RequestBody Map<String, Object> bookingData) {
        try {
            // Parse dữ liệu đầu vào
            Integer vehicleId = parseVehicleId(bookingData.get("vehicleId"));
            Integer stationId = parseStationId(bookingData.get("stationId"));
            String date = (String) bookingData.get("date");
            String time = (String) bookingData.get("time");
            String batteryType = (String) bookingData.getOrDefault("batteryType", "LITHIUM_ION");
            Integer batteryCount = (Integer) bookingData.getOrDefault("batteryCount", 1);

            // Tạo booking request - không cần set userId vì sẽ tự lấy từ vehicle
            BookingRequest bookingRequest = new BookingRequest();
            bookingRequest.setVehicleId(vehicleId);
            bookingRequest.setStationId(stationId);
            bookingRequest.setBookingDate(java.time.LocalDate.parse(date));
            bookingRequest.setTimeSlot(String.valueOf(java.time.LocalTime.parse(time)));
            // Set số pin muốn đổi (mặc định nếu không cung cấp sẽ lấy từ vehicle)
            bookingRequest.setBatteryCount(batteryCount);


            // Tạo booking
            BookingResponse booking = bookingService.createBooking(bookingRequest);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo booking thành công. UserId được tự động lấy từ xe.",
                    "booking", Map.of(
                            "bookingId", booking.getBookingId(),
                            "vehicleId", vehicleId,
                            "stationId", stationId,
                            "date", date,
                            "time", time,
                            "amount", booking.getAmount(),
                            "status", booking.getBookingStatus(),
                            "userId", booking.getUserId(),
                            "batteryCount", batteryCount
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Tạo booking thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/vehicles/{vehicleId}/bookings")
    @Operation(summary = "Lấy lịch sử booking của xe", description = "Lấy tất cả booking của một xe cụ thể theo vehicleId")
    public ResponseEntity<Map<String, Object>> getVehicleBookings(
            @PathVariable @Parameter(description = "ID của xe") Integer vehicleId,
            @RequestParam @Parameter(description = "ID của user") String userId) {
        try {
            List<BookingResponse> bookings = bookingService.getVehicleBookings(vehicleId, userId);
            Map<String, Object> vehicleDetail = bookingService.getVehicleDetail(vehicleId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "vehicleId", vehicleId,
                    "vehicle", vehicleDetail,
                    "bookings", bookings,
                    "totalBookings", bookings.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Lỗi lấy lịch sử booking xe",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/vehicles/{vehicleId}/quick-book")
    @Operation(summary = "Tạo booking nhanh cho xe cụ thể", description = "Tạo booking nhanh cho một xe với thông tin cơ bản")
    public ResponseEntity<Map<String, Object>> createQuickBookingForVehicle(
            @PathVariable @Parameter(description = "ID của xe") Integer vehicleId,
            @RequestParam @Parameter(description = "ID của user") String userId,
            @RequestParam @Parameter(description = "ID của station") Integer stationId,
            @RequestParam @Parameter(description = "Ngày booking (yyyy-MM-dd)") String date,
            @RequestParam @Parameter(description = "Giờ booking (HH:mm)") String time) {
        try {
            LocalDate bookingDate = LocalDate.parse(date);
            BookingResponse booking = bookingService.createQuickBookingForVehicle(
                    vehicleId, userId, stationId, bookingDate, time);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo booking nhanh thành công",
                    "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Tạo booking nhanh thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{bookingId}/vehicle")
    @Operation(summary = "Cập nhật xe trong booking", description = "Thay đổi xe trong booking đang chờ xử lý")
    public ResponseEntity<Map<String, Object>> updateVehicleInBooking(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId,
            @RequestParam @Parameter(description = "ID xe mới") Integer newVehicleId,
            @RequestParam @Parameter(description = "ID của user") String userId) {
        try {
            BookingResponse updatedBooking = bookingService.updateVehicleInBooking(bookingId, newVehicleId, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật xe trong booking thành công",
                    "booking", updatedBooking
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cập nhật xe trong booking thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/vehicles/search")
    @Operation(summary = "Tìm kiếm xe để booking", description = "Tìm kiếm xe có thể đặt lịch dựa trên các tiêu chí")
    public ResponseEntity<Map<String, Object>> searchVehiclesForBooking(
            @RequestParam @Parameter(description = "ID của user") String userId,
            @RequestParam(required = false) @Parameter(description = "Loại xe") String vehicleType,
            @RequestParam(required = false) @Parameter(description = "Loại pin") String batteryType,
            @RequestParam(required = false) @Parameter(description = "Biển số xe") String licensePlate) {
        try {
            List<Map<String, Object>> allVehicles = bookingService.getUserVehicles(userId);

            // Lọc xe theo tiêu chí
            List<Map<String, Object>> filteredVehicles = allVehicles.stream()
                    .filter(vehicle -> {
                        if (vehicleType != null && !vehicleType.isEmpty()) {
                            String vType = (String) vehicle.get("vehicleType");
                            if (!vehicleType.equalsIgnoreCase(vType)) return false;
                        }
                        if (batteryType != null && !batteryType.isEmpty()) {
                            String bType = (String) vehicle.get("batteryType");
                            if (!batteryType.equalsIgnoreCase(bType)) return false;
                        }
                        if (licensePlate != null && !licensePlate.isEmpty()) {
                            String plate = (String) vehicle.get("licensePlate");
                            if (plate == null || !plate.toLowerCase().contains(licensePlate.toLowerCase())) return false;
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "searchCriteria", Map.of(
                            "vehicleType", vehicleType != null ? vehicleType : "all",
                            "batteryType", batteryType != null ? batteryType : "all",
                            "licensePlate", licensePlate != null ? licensePlate : "all"
                    ),
                    "vehicles", filteredVehicles,
                    "total", filteredVehicles.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Tìm kiếm xe thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/statistics/user/{userId}")
    @Operation(summary = "Thống kê booking của user", description = "Lấy thống kê chi tiết về booking của user")
    public ResponseEntity<Map<String, Object>> getUserBookingStatistics(
            @PathVariable @Parameter(description = "ID của user") String userId) {
        try {
            List<BookingResponse> allBookings = bookingService.getUserBookings(userId);
            List<Map<String, Object>> userVehicles = bookingService.getUserVehicles(userId);

            // Thống kê theo trạng thái
            Map<String, Long> statusStats = allBookings.stream()
                    .collect(Collectors.groupingBy(
                            BookingResponse::getBookingStatus,
                            Collectors.counting()
                    ));

            // Thống kê theo xe
            Map<Integer, Long> vehicleStats = allBookings.stream()
                    .filter(booking -> booking.getVehicleId() != null)
                    .collect(Collectors.groupingBy(
                            BookingResponse::getVehicleId,
                            Collectors.counting()
                    ));

            // Tính tổng tiền
            double totalAmount = allBookings.stream()
                    .filter(booking -> booking.getAmount() != null)
                    .mapToDouble(BookingResponse::getAmount)
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "totalBookings", allBookings.size(),
                    "totalVehicles", userVehicles.size(),
                    "totalAmount", totalAmount,
                    "statusStatistics", statusStats,
                    "vehicleStatistics", vehicleStats,
                    "recentBookings", allBookings.stream()
                            .sorted((b1, b2) -> b2.getBookingDate().compareTo(b1.getBookingDate()))
                            .limit(5)
                            .collect(Collectors.toList())
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Lỗi lấy thống kê",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/validate-multiple-vehicles")
    @Operation(summary = "Kiểm tra nhiều xe có thể booking", description = "Kiểm tra danh sách xe có thể đặt lịch hay không")
    public ResponseEntity<Map<String, Object>> validateMultipleVehicles(
            @RequestParam @Parameter(description = "ID của user") String userId,
            @RequestBody List<Integer> vehicleIds) {
        try {
            List<Map<String, Object>> validationResults = new ArrayList<>();

            for (Integer vehicleId : vehicleIds) {
                try {
                    boolean isValid = bookingService.validateVehicleForBooking(vehicleId, userId);
                    Map<String, Object> vehicleInfo = bookingService.getVehicleDetail(vehicleId);

                    validationResults.add(Map.of(
                            "vehicleId", vehicleId,
                            "isValid", isValid,
                            "vehicle", vehicleInfo,
                            "canBook", isValid
                    ));
                } catch (Exception e) {
                    validationResults.add(Map.of(
                            "vehicleId", vehicleId,
                            "isValid", false,
                            "error", e.getMessage(),
                            "canBook", false
                    ));
                }
            }

            long validCount = validationResults.stream()
                    .mapToLong(result -> (Boolean) result.get("isValid") ? 1 : 0)
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "totalVehicles", vehicleIds.size(),
                    "validVehicles", validCount,
                    "invalidVehicles", vehicleIds.size() - validCount,
                    "validationResults", validationResults
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Kiểm tra xe thất bại",
                    "message", e.getMessage()
            ));
        }
    }

    // Thay thế method getBatteryPrice để sử dụng giá thống nhất từ SystemPrice
    private double getBatteryPrice(String batteryType) {
        // Bỏ qua batteryType vì giờ tất cả đều dùng chung 1 giá từ SystemPrice
        return systemPriceService.getCurrentPrice();
    }

    // Cập nhật API để lấy giá thống nhất từ SystemPrice
    @GetMapping("/battery-types")
    @Operation(summary = "Lấy danh sách loại pin và giá", description = "Lấy tất cả loại pin - giá thống nhất từ SystemPrice")
    public ResponseEntity<Map<String, Object>> getBatteryTypes() {
        try {
            Double systemPrice = systemPriceService.getCurrentPrice();
            String priceInfo = systemPriceService.getCurrentPriceInfo();
            List<Map<String, Object>> batteryTypes = new ArrayList<>();

            // Tất cả loại pin đều có cùng 1 giá từ SystemPrice
            for (Battery.BatteryType type : Battery.BatteryType.getAllTypes()) {
                batteryTypes.add(Map.of(
                    "type", type.name(),
                    "displayName", type.getDisplayName(),
                    "price", systemPrice, // Tất cả đều dùng giá thống nhất
                    "systemRule", "Giá thống nhất cho tất cả loại pin"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "batteryTypes", batteryTypes,
                "total", batteryTypes.size(),
                "systemPrice", systemPrice,
                "priceInfo", priceInfo,
                "source", "SystemPrice - Quy luật chung toàn dự án",
                "rule", "Tất cả loại pin đều sử dụng cùng 1 giá: " + systemPrice + " VND"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi lấy danh sách loại pin",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/create-after-payment")
    @Operation(summary = "Tạo booking sau khi thanh toán", description = "Tạo booking sau khi thanh toán đã hoàn thành - Flow mới")
    public ResponseEntity<ApiResponseDto> createBookingAfterPayment(
            @RequestBody BookingService.PaymentCompletedRequest request) {
        try {
            BookingResponse response = bookingService.createBookingAfterPayment(request);
            return ResponseEntity.ok(new ApiResponseDto(true, "Tạo booking sau thanh toán thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Lỗi tạo booking sau thanh toán: " + e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/complete-swapping")
    @Operation(summary = "Hoàn thành đổi pin",
               description = "Chuyển booking từ trạng thái PENDINGSWAPPING sang COMPLETED sau khi đổi pin thành công")
    public ResponseEntity<ApiResponseDto> completeBatterySwapping(
            @PathVariable @Parameter(description = "ID của booking") Long bookingId) {
        try {
            BookingResponse response = bookingService.completeBatterySwapping(bookingId);
            return ResponseEntity.ok(new ApiResponseDto(true, response.getMessage(), response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Hoàn thành đổi pin thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/{bookingId}/process-payment")
    @Operation(summary = "Xử lý thanh toán booking", description = "Chuyển trạng thái booking từ PENDINGPAYMENT sang PENDINGSWAPPING")
    public ResponseEntity<ApiResponseDto> processPayment(
            @PathVariable Long bookingId) {
        try {
            BookingResponse response = bookingService.processPayment(bookingId);
            return ResponseEntity.ok(new ApiResponseDto(true, "Xử lý thanh toán thành công!", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Xử lý thanh toán thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/batch")
    @Operation(
            summary = "Tạo nhiều booking linh hoạt (tối đa 3 xe)",
            description = "Mỗi xe có thể đặt khác trạm, khác giờ"
    )
    public ResponseEntity<ApiResponseDto> createBatchBooking(
            @RequestBody @Valid FlexibleBatchBookingRequest request) {

        // (Giữ nguyên các validation ban đầu của bạn)
        if (request.getBookings() == null || request.getBookings().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Danh sách booking không được rỗng!"));
        }
        if (request.getBookings().size() > 3) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Chỉ cho phép book tối đa 3 xe cùng lúc!"));
        }

        try {
            // [KHÔNG THAY ĐỔI]
            // Service sẽ trả về Map nếu TẤT CẢ thành công
            Map<String, Object> response = bookingService.createFlexibleBatchBooking(request);

            return ResponseEntity.ok(new ApiResponseDto(
                    true,
                    (String) response.get("message"),
                    response
            ));

        } catch (Exception e) {

            // [LOGIC MỚI CHO YÊU CẦU 5 & 6]
            // Bắt Exception từ Service (ví dụ: "Trạm không đủ pin...")
            // Trả về thông báo lỗi chung, chỉ rõ lý do
            // và xác nhận không ghi nhận booking nào.

            String errorMessage = String.format(
                    "Đặt lịch batch thất bại. Lý do: %s. Không có booking nào được ghi nhận.",
                    e.getMessage() // e.g., "Trạm không đủ pin cho khung giờ này..."
            );

            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, errorMessage)); // Không trả về chi tiết booking
        }
    }

    /**
     * API để xóa một hoặc nhiều booking cùng lúc
     * Xử lý cả trường hợp xóa 1 ID: Body: [101]
     * và xóa nhiều ID: Body: [101, 102, 103]
     *
     * @param bookingIds Danh sách ID của các booking cần xóa
     * @return ApiResponseDto
     */
    @DeleteMapping("/delete") // Bạn có thể dùng /batch hoặc /delete tùy ý
    @Operation(summary = "Xóa một hoặc nhiều booking",
            description = "Xóa booking theo danh sách ID, bất kể trạng thái. Gửi [101] để xóa 1 booking.")
    public ResponseEntity<ApiResponseDto> deleteBatchBookings(
            @Parameter(description = "Danh sách ID của các booking cần xóa. Ví dụ: [1, 2]")
            @RequestBody List<Long> bookingIds) {

        if (bookingIds == null || bookingIds.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseDto(false, "Danh sách ID không được rỗng."));
        }

        try {
            Map<String, Integer> result = bookingService.deleteBookings(bookingIds);
            int deletedCount = result.get("deleted");
            int notFoundCount = result.get("notFound");

            // Tạo thông báo kết quả
            String message = String.format("Đã xóa thành công %d booking.", deletedCount);
            if (notFoundCount > 0) {
                message += String.format(" Không tìm thấy %d booking.", notFoundCount);
            }

            return ResponseEntity.ok(new ApiResponseDto(true, message, result));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponseDto(false, "Lỗi máy chủ khi xóa: " + e.getMessage()));
        }
    }


}
