package BatterySwapStation.service;

import BatterySwapStation.dto.BookingRequest;
import BatterySwapStation.dto.BookingResponse;
import BatterySwapStation.dto.CancelBookingRequest;
import BatterySwapStation.dto.FlexibleBatchBookingRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final VehicleRepository vehicleRepository;
    private final SystemPriceService systemPriceService; // Thêm SystemPriceService
    private final InvoiceService invoiceService; // Để tạo/cập nhật invoice khi tạo nhiều booking

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Tạo đặt chỗ mới (giới hạn tối đa 1 xe, chỉ 1 trạm, ngày trong 2 ngày, khung giờ hợp lệ)
     */
    public BookingResponse createBooking(BookingRequest request) {
        // Xác thực xe trước tiên để lấy userId
        Integer vehicleId = request.getVehicleId();
        if (vehicleId == null) {
            throw new IllegalArgumentException("Bạn phải chọn một xe để đặt pin.");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + vehicleId));

        // Tự động lấy userId từ vehicle
        if (vehicle.getUser() == null) {
            throw new IllegalArgumentException("Xe này chưa được đăng ký cho người dùng nào.");
        }

        User user = vehicle.getUser();

        // ========== KIỂM TRA XE CÓ BOOKING CHƯA HOÀN THÀNH ==========
        // Kiểm tra xe có booking chưa hoàn thành không
        if (bookingRepository.hasIncompleteBookingForVehicle(vehicleId)) {
            // Lấy thông tin booking chưa hoàn thành để hiển thị chi tiết
            List<Booking> incompleteBookings = bookingRepository.findIncompleteBookingsByVehicle(vehicleId);

            if (!incompleteBookings.isEmpty()) {
                Booking firstIncomplete = incompleteBookings.get(0);
                throw new IllegalStateException(String.format(
                        "Xe %s đang có booking #%d chưa hoàn thành (Trạng thái: %s, Ngày: %s, Giờ: %s). " +
                                "Vui lòng hoàn thành hoặc hủy booking này trước khi đặt mới.",
                        vehicle.getVIN(),
                        firstIncomplete.getBookingId(),
                        firstIncomplete.getBookingStatus(),
                        firstIncomplete.getBookingDate(),
                        firstIncomplete.getTimeSlot()
                ));
            } else {
                // Fallback nếu không lấy được chi tiết
                throw new IllegalStateException(String.format(
                        "Xe %s đang có booking chưa hoàn thành. " +
                                "Vui lòng hoàn thành hoặc hủy booking hiện tại trước khi đặt mới.",
                        vehicle.getVIN()
                ));
            }
        }
        // =============================================================

        // Xác thực trạm
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trạm với mã: " + request.getStationId()));

        // Kiểm tra ngày đặt chỗ trong vòng 7 ngày
        LocalDate now = LocalDate.now();
        if (request.getBookingDate().isBefore(now) || request.getBookingDate().isAfter(now.plusDays(7))) {
            throw new IllegalArgumentException("Ngày đặt pin phải nằm trong vòng 7 ngày kể từ hôm nay.");
        }

        // Kiểm tra khung giờ hợp lệ (chỉ nhận các giá trị ví dụ: 8h30, 10h, 20h30)
        if (request.getTimeSlot() == null) {
            throw new IllegalArgumentException("Bạn phải chọn khung giờ.");
        }

        // Chuyển đổi String sang LocalTime
        LocalTime timeSlot = LocalTime.parse(request.getTimeSlot(), DateTimeFormatter.ofPattern("HH:mm"));

        // Hệ thống hoạt động 24/7 - không giới hạn khung giờ

        // Kiểm tra người dùng đã có đặt chỗ đang hoạt động chưa
        LocalDate currentDate = LocalDate.now();
        if (bookingRepository.existsActiveBookingForUserByDate(user, currentDate)) {
            throw new IllegalStateException("Bạn đã có một lượt đặt pin đang hoạt động.");
        }

        // Kiểm tra khung giờ đã được đặt chưa
        if (bookingRepository.existsBookingAtTimeSlot(station, request.getBookingDate(), timeSlot)) {
            throw new IllegalStateException("Khung giờ này đã có người đặt trước.");
        }

        // Kiểm tra trùng lặp booking: cùng user, vehicle, station, ngày, và khung giờ
        if (bookingRepository.existsDuplicateBooking(user, vehicle, station, request.getBookingDate(), timeSlot)) {
            throw new IllegalStateException("Bạn không thể đặt cùng một xe tại cùng một trạm và khung giờ.");
        }

        // Xác định số pin muốn đổi (nếu client không gửi thì mặc định bằng batteryCount của xe)
        Integer requestedBatteryCount = request.getBatteryCount();
        if (requestedBatteryCount == null) {
            requestedBatteryCount = vehicle.getBatteryCount();
        }

        if (requestedBatteryCount <= 0) {
            throw new IllegalArgumentException("Số pin muốn đổi phải lớn hơn 0.");
        }

        if (vehicle.getBatteryCount() > 0 && requestedBatteryCount > vehicle.getBatteryCount()) {
            throw new IllegalArgumentException("Số pin muốn đổi không được vượt quá số pin của phương tiện: " + vehicle.getBatteryCount());
        }

        // Tính giá theo systemPrice nhân với số pin thực tế
        Double basePrice = systemPriceService.getCurrentPrice();
        Double bookingAmount = basePrice * requestedBatteryCount.doubleValue();

        // Lấy vehicleType từ vehicle
        String vehicleTypeStr = vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN";

        // Lấy batteryType từ request nếu có, nếu không thì lấy từ vehicle
        String batteryTypeStr = request.getBatteryType();
        if (batteryTypeStr == null || batteryTypeStr.isBlank()) {
            batteryTypeStr = vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : "UNKNOWN";
        }

        // Tạo đặt chỗ mới (bao gồm số pin muốn đổi)
        Booking booking = Booking.builder()
                .user(user)
                .station(station)
                .vehicle(vehicle)
                .vehicleType(vehicleTypeStr) // Lưu loại xe
                .amount(bookingAmount) // Lưu giá tiền
                .bookingDate(request.getBookingDate())
                .timeSlot(timeSlot)
                .batteryType(batteryTypeStr) // Lưu loại pin
                .batteryCount(requestedBatteryCount)
                .bookingStatus(Booking.BookingStatus.PENDINGPAYMENT)  // Chỉ dùng bookingStatus
                .notes("Đặt lịch qua API")
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo thành công khi tạo booking với tổng tiền
        BookingResponse response = convertToResponse(savedBooking);
        String createMessage = String.format(
                "Booking #%d được tạo thành công! Tổng tiền: %.0f VND",
                savedBooking.getBookingId(),
                savedBooking.getAmount()
        );
        response.setMessage(createMessage);

        // Map số pin muốn đổi
        response.setBatteryCount(savedBooking.getBatteryCount());

        return response;
    }

    /**
     * Lấy danh sách đặt chỗ của người dùng
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        List<Booking> bookings = bookingRepository.findByUser(user);
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy đặt chỗ theo ID
     */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        Booking booking = bookingRepository.findByBookingIdAndUser(bookingId, user)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        return convertToResponse(booking);
    }

    /**
     * Hủy đặt chỗ
     */
    public BookingResponse cancelBooking(CancelBookingRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + request.getUserId()));

        Booking booking = bookingRepository.findByBookingIdAndUser(request.getBookingId(), user)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + request.getBookingId()));

        // Kiểm tra đặt chỗ có thể hủy không
        if (Booking.BookingStatus.CANCELLED.equals(booking.getBookingStatus())) {
            throw new IllegalStateException("Lượt đặt pin này đã bị hủy trước đó.");
        }

        if (Booking.BookingStatus.COMPLETED.equals(booking.getBookingStatus())) {
            throw new IllegalStateException("Không thể hủy lượt đặt pin đã hoàn thành.");
        }

        // Kiểm tra thời gian hủy: phải trước 1 tiếng so với thời gian đặt lịch
        LocalDateTime scheduledDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getTimeSlot());
        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime minimumCancelTime = scheduledDateTime.minusHours(1);

        if (currentDateTime.isAfter(minimumCancelTime)) {
            throw new IllegalStateException(
                String.format("Không thể hủy booking. Chỉ có thể hủy trước ít nhất 1 tiếng so với thời gian đặt lịch (%s %s). " +
                             "Thời gian giới hạn hủy là: %s",
                    booking.getBookingDate(),
                    booking.getTimeSlot(),
                    minimumCancelTime)
            );
        }

        // Hủy đặt chỗ và lưu lý do hủy
        booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(request.getCancelReason()); // Lưu lý do hủy
        Booking savedBooking = bookingRepository.save(booking);

        // Tạo response với message
        BookingResponse response = convertToResponse(savedBooking);
        String cancelMessage = String.format(
            "Booking #%d đã được hủy thành công! Lý do: %s",
            savedBooking.getBookingId(),
            request.getCancelReason() != null ? request.getCancelReason() : "Không có lý do"
        );
        response.setMessage(cancelMessage);

        return response;
    }

    /**
     * Lấy danh sách đặt chỗ theo trạng thái
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStatus(String status) {
        // Chuyển đổi String sang enum
        try {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            List<Booking> bookings = bookingRepository.findByBookingStatus(bookingStatus);
            return bookings.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status + ". Các trạng thái hợp lệ: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED");
        }
    }

    /**
     * Lấy danh sách đặt chỗ của trạm
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getStationBookings(Integer stationId) {
        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trạm với mã: " + stationId));

        List<Booking> bookings = bookingRepository.findByStation(station);
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật trạng thái đặt chỗ
     */
    public BookingResponse updateBookingStatus(Long bookingId, String newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        // Chuyển đổi String sang enum
        try {
            Booking.BookingStatus status = Booking.BookingStatus.valueOf(newStatus.toUpperCase());
            booking.setBookingStatus(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + newStatus + ". Các trạng thái hợp lệ: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED, FAILED");
        }

        Booking savedBooking = bookingRepository.save(booking);

        return convertToResponse(savedBooking);
    }

    /**
     * Lấy tất cả đặt chỗ (dành cho quản trị viên)
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Xác nhận thanh toán cho booking với thông báo
     */
    public BookingResponse confirmPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin v��i mã: " + bookingId));

        // Cập nhật trạng thái booking - SỬ DỤNG TRẠNG THÁI MỚI
        booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING); // Chuyển sang chờ đổi pin

        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo thanh toán thành công
        String paymentMessage = String.format(
            "Thanh toán thành công cho Booking #%d. Số tiền: %.0f VND. Trạng thái: Chờ đổi pin",
            booking.getBookingId(),
            booking.getAmount()
        );

        BookingResponse response = convertToResponse(savedBooking);
        response.setMessage(paymentMessage); // Thêm message vào response

        return response;
    }

    /**
     * Hoàn thành booking và tạo invoice với thông báo
     */
    public BookingResponse completeBookingWithInvoice(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đ��t pin v��i mã: " + bookingId));

        // Cập nhật trạng thái booking thành COMPLETED
        booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedTime(LocalDate.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo thành công
        String successMessage = String.format(
            "Booking #%d được hoàn thành thành công. T����ng tiền: %.0f VND",
            booking.getBookingId(),
            booking.getAmount()
        );

        BookingResponse response = convertToResponse(savedBooking);
        response.setMessage(successMessage); // Thêm message vào response

        return response;
    }

    /**
     * Hoàn thành việc đổi pin (chuyển từ PENDINGSWAPPING sang COMPLETED)
     */
    public BookingResponse completeBatterySwapping(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        // Kiểm tra booking đang chờ đổi pin chưa
        if (booking.getBookingStatus() != Booking.BookingStatus.PENDINGSWAPPING) {
            throw new IllegalStateException("Booking phải ở trạng thái chờ đổi pin (PENDINGSWAPPING) để có thể hoàn thành.");
        }

        // Cập nhật trạng thái booking thành COMPLETED
        booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedTime(LocalDate.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo thành công
        String successMessage = String.format(
            "Booking #%d đã hoàn thành đổi pin thành công! Tổng tiền: %.0f VND",
            booking.getBookingId(),
            booking.getAmount()
        );

        BookingResponse response = convertToResponse(savedBooking);
        response.setMessage(successMessage);

        return response;
    }

    /**
     * Xử lý thanh toán đơn giản - chuyển từ PENDINGPAYMENT sang PENDINGSWAPPING ngay lập tức
     */
    public BookingResponse processPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        // Kiểm tra booking đang chờ thanh toán chưa
        if (booking.getBookingStatus() != Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Booking phải ở trạng thái chờ thanh toán (PENDINGPAYMENT) để có thể xử lý thanh toán.");
        }

        // Cập nhật trạng thái booking sang chờ đổi pin ngay lập tức
        booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);

        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo xử lý thanh toán thành công
        String paymentMessage = String.format(
            "Xử lý thanh toán thành công cho Booking #%d. Số tiền: %.0f VND. Trạng thái: Chờ đổi pin",
            booking.getBookingId(),
            booking.getAmount()
        );

        BookingResponse response = convertToResponse(savedBooking);
        response.setMessage(paymentMessage);

        return response;
    }

    /**
     * Chuyển trạng thái booking từ PENDINGPAYMENT sang FAILED
     */
    @Transactional
    public BookingResponse markBookingAsFailed(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        if (booking.getBookingStatus() != Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Chỉ có thể chuyển sang FAILED khi trạng thái hiện tại là PENDINGPAYMENT");
        }

        // Set trạng thái FAILED
        booking.setBookingStatus(Booking.BookingStatus.FAILED);

        // Set lý do hủy
        booking.setCancellationReason("Thanh toán thất bại");

        Booking savedBooking = bookingRepository.save(booking);
        return convertToResponse(savedBooking);
    }

    /**
     * Lấy danh sách đặt chỗ của người dùng theo ngày
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookingsByDate(String userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        List<Booking> bookings = bookingRepository.findByUserAndBookingDate(user, date);
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách đặt chỗ theo trạng thái và ngày (dành cho quản trị viên)
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStatusAndDate(String status, LocalDate date) {
        // Chuyển đổi String sang enum
        try {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            List<Booking> bookings = bookingRepository.findByBookingStatusAndBookingDate(bookingStatus, date);
            return bookings.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status + ". Các trạng thái hợp lệ: PENDINGPAYMENT, PENDINGSWAPPING, CANCELLED, COMPLETED");
        }
    }

    /**
     * Lấy danh sách đặt chỗ của trạm theo ngày
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getStationBookingsByDate(Integer stationId, LocalDate date) {
        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trạm với mã: " + stationId));

        List<Booking> bookings = bookingRepository.findByStationAndBookingDate(station, date);
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật ghi chú cho booking
     */
    public BookingResponse updateBookingNotes(Long bookingId, String notes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        // Cập nhật ghi chú
        booking.setNotes(notes);

        Booking savedBooking = bookingRepository.save(booking);
        return convertToResponse(savedBooking);
    }

    /**
     * Lấy danh sách xe của user
     */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getUserVehicles(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        List<Vehicle> vehicles = vehicleRepository.findByUserAndIsActiveTrueWithOwner(user);

        return vehicles.stream()
                .map(vehicle -> {
                    java.util.Map<String, Object> vehicleMap = new java.util.HashMap<>();
                    vehicleMap.put("vehicleId", vehicle.getVehicleId());
                    vehicleMap.put("VIN", vehicle.getVIN());
                    vehicleMap.put("vehicleType", vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN");
                    vehicleMap.put("batteryType", vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : "UNKNOWN");
                    vehicleMap.put("batteryCount", vehicle.getBatteryCount());
                    vehicleMap.put("licensePlate", vehicle.getLicensePlate());
                    vehicleMap.put("color", vehicle.getColor());
                    vehicleMap.put("ownerName", vehicle.getOwnerName());
                    vehicleMap.put("isActive", vehicle.isActive());
                    vehicleMap.put("manufactureDate", vehicle.getManufactureDate());
                    vehicleMap.put("purchaseDate", vehicle.getPurchaseDate());

                    // Tính giá dự kiến cho việc thay pin
                    Double estimatedPrice = calculateBookingAmountByVehicleBatteryType(vehicle);
                    vehicleMap.put("estimatedSwapPrice", estimatedPrice);

                    return vehicleMap;
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết xe
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getVehicleDetail(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + vehicleId));

        java.util.Map<String, Object> vehicleDetail = new java.util.HashMap<>();
        vehicleDetail.put("vehicleId", vehicle.getVehicleId());
        vehicleDetail.put("VIN", vehicle.getVIN());
        vehicleDetail.put("vehicleType", vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN");
        vehicleDetail.put("batteryType", vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : "UNKNOWN");
        vehicleDetail.put("batteryCount", vehicle.getBatteryCount());
        vehicleDetail.put("licensePlate", vehicle.getLicensePlate());
        vehicleDetail.put("color", vehicle.getColor());
        vehicleDetail.put("ownerName", vehicle.getOwnerName());
        vehicleDetail.put("isActive", vehicle.isActive());
        vehicleDetail.put("manufactureDate", vehicle.getManufactureDate());
        vehicleDetail.put("purchaseDate", vehicle.getPurchaseDate());

        // Thông tin user sở hữu
        if (vehicle.getUser() != null) {
            vehicleDetail.put("userId", vehicle.getUser().getUserId());
            vehicleDetail.put("userName", vehicle.getUser().getFullName());
            vehicleDetail.put("userEmail", vehicle.getUser().getEmail());
        }

        // Tính giá dự kiến cho việc thay pin
        Double estimatedPrice = calculateBookingAmountByVehicleBatteryType(vehicle);
        vehicleDetail.put("estimatedSwapPrice", estimatedPrice);

        // ===== KIỂM TRA VÀ HIỂN THỊ BOOKING CHƯA HOÀN THÀNH =====
        boolean hasIncompleteBooking = bookingRepository.hasIncompleteBookingForVehicle(vehicleId);
        vehicleDetail.put("hasIncompleteBooking", hasIncompleteBooking);

        // Nếu có booking chưa hoàn thành, lấy thông tin chi tiết
        if (hasIncompleteBooking) {
            List<Booking> incompleteBookings = bookingRepository.findIncompleteBookingsByVehicle(vehicleId);
            if (!incompleteBookings.isEmpty()) {
                Booking firstIncomplete = incompleteBookings.get(0);
                java.util.Map<String, Object> incompleteBookingInfo = new java.util.HashMap<>();
                incompleteBookingInfo.put("bookingId", firstIncomplete.getBookingId());
                incompleteBookingInfo.put("status", firstIncomplete.getBookingStatus());
                incompleteBookingInfo.put("bookingDate", firstIncomplete.getBookingDate());
                incompleteBookingInfo.put("timeSlot", firstIncomplete.getTimeSlot());
                incompleteBookingInfo.put("stationName", firstIncomplete.getStation().getStationName());
                incompleteBookingInfo.put("amount", firstIncomplete.getAmount());
                vehicleDetail.put("incompleteBookingInfo", incompleteBookingInfo);
            }
        }
        // =========================================================

        return vehicleDetail;
    }

    /**
     * Kiểm tra xe có thể booking không
     */
    @Transactional(readOnly = true)
    public boolean validateVehicleForBooking(Integer vehicleId, String userId) {
        try {
            // Kiểm tra xe tồn tại
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + vehicleId));

            // Kiểm tra xe thuộc về user
            if (vehicle.getUser() == null || !vehicle.getUser().getUserId().equals(userId)) {
                return false;
            }

            // Kiểm tra xe đang hoạt động
            if (!vehicle.isActive()) {
                return false;
            }

            // ===== KIỂM TRA XE CÓ BOOKING CHƯA HOÀN THÀNH =====
            if (bookingRepository.hasIncompleteBookingForVehicle(vehicleId)) {
                return false;
            }
            // ==================================================

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy danh sách booking của xe cụ thể
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getVehicleBookings(Integer vehicleId, String userId) {
        Vehicle vehicle = vehicleRepository.findByVehicleIdAndUser_UserId(vehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + vehicleId + " thuộc về user: " + userId));

        List<Booking> bookings = bookingRepository.findByVehicle(vehicle);
        return bookings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo booking nhanh cho xe cụ thể
     */
    public BookingResponse createQuickBookingForVehicle(Integer vehicleId, String userId, Integer stationId,
                                                       LocalDate bookingDate, String timeSlot) {
        // Validate xe thuộc về user
        Vehicle vehicle = vehicleRepository.findByVehicleIdAndUser_UserId(vehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + vehicleId + " thuộc về user: " + userId));

        // Tạo booking request
        BookingRequest request = new BookingRequest();
        request.setUserId(userId);
        request.setVehicleId(vehicleId);
        request.setStationId(stationId);
        request.setBookingDate(bookingDate);
        request.setTimeSlot(timeSlot);

        return createBooking(request);
    }

    /**
     * Cập nhật thông tin xe trong booking (nếu cần)
     */
    public BookingResponse updateVehicleInBooking(Long bookingId, Integer newVehicleId, String userId) {
        // Lấy booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking với mã: " + bookingId));

        // Kiểm tra quyền sở hữu
        if (!booking.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật booking này");
        }

        // Kiểm tra trạng thái booking
        if (booking.getBookingStatus() != Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Chỉ có thể cập nhật xe cho booking đang chờ xử lý");
        }

        // Validate xe mới
        Vehicle newVehicle = vehicleRepository.findByVehicleIdAndUser_UserId(newVehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + newVehicleId + " thuộc về user: " + userId));

        // Cập nhật xe và tính lại giá
        booking.setVehicle(newVehicle);
        booking.setVehicleType(newVehicle.getVehicleType() != null ? newVehicle.getVehicleType().toString() : "UNKNOWN");
        booking.setAmount(calculateBookingAmountByVehicleBatteryType(newVehicle));

        Booking savedBooking = bookingRepository.save(booking);
        return convertToResponse(savedBooking);
    }

    /**
     * Tạo booking sau khi thanh toán hoàn thành - Flow mới
     */
    public BookingResponse createBookingAfterPayment(PaymentCompletedRequest request) {
        try {
            // Validate thông tin đầu vào
            validatePaymentRequest(request);

            // Lấy thông tin vehicle và user
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã: " + request.getVehicleId()));

            User user = vehicle.getUser();
            if (user == null) {
                throw new IllegalArgumentException("Xe này chưa được đăng ký cho người dùng nào.");
            }

            // Lấy thông tin station
            Station station = stationRepository.findById(request.getStationId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trạm với mã: " + request.getStationId()));

            // Kiểm tra slot thời gian có còn trống không
            LocalDate bookingDate = LocalDate.parse(request.getBookingDate());
            LocalTime timeSlot = LocalTime.parse(request.getTimeSlot());

            if (bookingRepository.existsBookingAtTimeSlot(station, bookingDate, timeSlot)) {
                throw new IllegalStateException("Khung giờ này đã có người đặt trước.");
            }

            // Verify số tiền thanh toán có đúng không
            Double expectedAmount = systemPriceService.getCurrentPrice() * request.getQuantity();
            if (!expectedAmount.equals(request.getPaidAmount())) {
                throw new IllegalArgumentException("Số tiền thanh toán không đúng. Mong đợi: " + expectedAmount + ", Nhận được: " + request.getPaidAmount());
            }

            // Tạo booking với trạng thái đã thanh toán
            Booking booking = Booking.builder()
                    .user(user)
                    .station(station)
                    .vehicle(vehicle)
                    .vehicleType(vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN")
                    .amount(request.getPaidAmount())
                    .batteryCount(request.getQuantity())
                    .bookingDate(bookingDate)
                    .timeSlot(timeSlot)
                    .bookingStatus(Booking.BookingStatus.PENDINGSWAPPING) // Đã thanh toán, chờ đổi pin
                    .notes("Booking được tạo sau khi thanh toán hoàn thành. Payment ID: " + request.getPaymentId())
                    .build();

            Booking savedBooking = bookingRepository.save(booking);

            // Tạo response
            BookingResponse response = convertToResponse(savedBooking);
            response.setMessage("Booking được tạo thành công sau thanh toán hoàn thành!");

            return response;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo booking sau thanh toán: " + e.getMessage(), e);
        }
    }

    /**
     * Validate thông tin thanh toán
     */
    private void validatePaymentRequest(PaymentCompletedRequest request) {
        if (request.getVehicleId() == null) {
            throw new IllegalArgumentException("Vehicle ID không được để trống");
        }
        if (request.getStationId() == null) {
            throw new IllegalArgumentException("Station ID không được để trống");
        }
        if (request.getBookingDate() == null || request.getBookingDate().isEmpty()) {
            throw new IllegalArgumentException("Ngày booking không được để trống");
        }
        if (request.getTimeSlot() == null || request.getTimeSlot().isEmpty()) {
            throw new IllegalArgumentException("Khung giờ không được để trống");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }
        if (request.getPaidAmount() == null || request.getPaidAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }
        if (request.getPaymentId() == null || request.getPaymentId().isEmpty()) {
            throw new IllegalArgumentException("Payment ID không được để trống");
        }
    }

    /**
     * DTO cho request tạo booking sau thanh toán
     */
    public static class PaymentCompletedRequest {
        private Integer vehicleId;
        private Integer stationId;
        private String bookingDate; // yyyy-MM-dd
        private String timeSlot; // HH:mm
        private Integer quantity;
        private Double paidAmount;
        private String paymentId;
        private String paymentMethod;

        // Constructors
        public PaymentCompletedRequest() {}

        // Getters and setters
        public Integer getVehicleId() { return vehicleId; }
        public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }

        public Integer getStationId() { return stationId; }
        public void setStationId(Integer stationId) { this.stationId = stationId; }

        public String getBookingDate() { return bookingDate; }
        public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }

        public String getTimeSlot() { return timeSlot; }
        public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public Double getPaidAmount() { return paidAmount; }
        public void setPaidAmount(Double paidAmount) { this.paidAmount = paidAmount; }

        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }

    /**
     * Kiểm tra time slot đã bị đặt chưa (cho PaymentService sử dụng)
     */
    @Transactional(readOnly = true)
    public boolean isTimeSlotTaken(Station station, LocalDate date, LocalTime timeSlot) {
        return bookingRepository.existsBookingAtTimeSlot(station, date, timeSlot);
    }

    /**
     * Lưu booking trực tiếp (dành cho PaymentService sau khi thanh toán thành công)
     */
    public BookingResponse saveBookingDirectly(Booking booking) {
        Booking savedBooking = bookingRepository.save(booking);

        // Tạo response với message thành công
        BookingResponse response = convertToResponse(savedBooking);
        String createMessage = String.format(
            "Booking #%d được tạo thành công sau thanh toán! Tổng tiền: %.0f VND",
            savedBooking.getBookingId(),
            savedBooking.getAmount()
        );
        response.setMessage(createMessage);

        return response;
    }

    /**
     * Phân tích và chuyển đổi ID xe từ Object sang Integer (có thể null)
     */
    private Integer parseVehicleId(Object vehicleIdObj) {
        if (vehicleIdObj == null) {
            return null;
        }
        if (vehicleIdObj instanceof Integer) {
            return (Integer) vehicleIdObj;
        }
        if (vehicleIdObj instanceof String) {
            String vehicleIdStr = (String) vehicleIdObj;
            if (!vehicleIdStr.isEmpty()) {
                return Integer.valueOf(vehicleIdStr);
            }
        }
        return null;
    }

    /**
     * Phân tích và chuyển đổi ID trạm từ Object sang Integer (có thể null)
     */
    private Integer parseStationId(Object stationIdObj) {
        if (stationIdObj == null) {
            return null;
        }
        if (stationIdObj instanceof Integer) {
            return (Integer) stationIdObj;
        }
        if (stationIdObj instanceof String) {
            String stationIdStr = (String) stationIdObj;
            if (!stationIdStr.isEmpty()) {
                return Integer.valueOf(stationIdStr);
            }
        }
        return null;
    }

    /**
     * Convert Booking entity sang BookingResponse DTO
     */
    private BookingResponse convertToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();

        // Thông tin booking cơ bản
        response.setBookingId(booking.getBookingId());
        response.setBookingStatus(booking.getBookingStatus().name());
        response.setAmount(booking.getAmount());
        response.setBookingDate(booking.getBookingDate());
        response.setTimeSlot(booking.getTimeSlot());

        // Thông tin user
        if (booking.getUser() != null) {
            response.setUserId(booking.getUser().getUserId());
            response.setUserName(booking.getUser().getFullName());
        }

        // Thông tin trạm
        if (booking.getStation() != null) {
            response.setStationId(booking.getStation().getStationId());
            response.setStationName(booking.getStation().getStationName());
            response.setStationAddress(booking.getStation().getAddress());
        }

        // Thông tin xe
        if (booking.getVehicle() != null) {
            response.setVehicleId(booking.getVehicle().getVehicleId());
            response.setVehicleVin(booking.getVehicle().getVIN());
            response.setVehicleType(booking.getVehicle().getVehicleType().name()); // Convert enum to String
        }

        // Thông tin pin
        response.setBatteryCount(booking.getBatteryCount());
        response.setBatteryType(booking.getBatteryType());

        // Thông tin bổ sung
        response.setNotes(booking.getNotes());
        response.setCancellationReason(booking.getCancellationReason());
        response.setCompletedTime(booking.getCompletedTime());

        // Thông tin hóa đơn
        if (booking.getInvoice() != null) {
            response.setInvoiceId(String.valueOf(booking.getInvoice().getInvoiceId())); // Convert Long to String
        }

        // Thông tin thanh toán (để null, sẽ implement sau)
        response.setPayment(null);

        return response;
    }

    /**
     * Tính toán giá tiền đặt chỗ dựa trên SystemPrice - THỐNG NHẤT CHO TẤT CẢ
     */
    private Double calculateBookingAmountByVehicleBatteryType(Vehicle vehicle) {
        // Lấy giá thống nhất từ SystemPrice (không phân biệt loại pin)
        double basePrice = systemPriceService.getCurrentPrice();

        // Nhân với số lượng pin của xe (nếu có)
        Integer batteryCount = vehicle.getBatteryCount();
        if (batteryCount != null && batteryCount > 0) {
            return basePrice * batteryCount;
        }

        return basePrice;
    }

    // Đảm bảo hàm này tồn tại đúng chữ ký public
    public java.util.Map<String, Object> createInvoiceFromVehicles(java.util.List<java.util.Map<String, Object>> vehicleBatteryData) {
        throw new UnsupportedOperationException("Chưa triển khai logic ở đây. Hãy copy logic từ phiên bản đã chỉnh sửa trước đó nếu cần.");
    }

    /**
     * Xử lý batch booking: lặp qua từng BookingRequest, áp dụng kiểm tra trùng lặp như createBooking
     */
    public List<BookingResponse> createBatchBooking(List<BookingRequest> requests) {
        List<BookingResponse> responses = new ArrayList<>();
        for (BookingRequest request : requests) {
            try {
                BookingResponse response = createBooking(request); // Áp dụng toàn bộ kiểm tra trùng lặp
                responses.add(response);
            } catch (Exception e) {
                BookingResponse errorResponse = new BookingResponse();
                errorResponse.setMessage("Booking thất bại: " + e.getMessage());
                errorResponse.setBookingStatus("FAILED");
                responses.add(errorResponse);
            }
        }
        return responses;
    }

    /**
     * Tạo flexible batch booking - mỗi xe có thể đặt khác trạm/giờ
     */
    @Transactional
    public Map<String, Object> createFlexibleBatchBooking(FlexibleBatchBookingRequest request) {
        List<BookingResponse> successBookings = new ArrayList<>();
        List<Map<String, Object>> failedBookings = new ArrayList<>();
        double totalAmount = 0.0;

        // Validate tối đa 3 bookings
        if (request.getBookings().size() > 3) {
            throw new IllegalArgumentException("Chỉ cho phép book tối đa 3 xe cùng lúc!");
        }

        // Lặp qua từng booking request
        for (BookingRequest bookingRequest : request.getBookings()) {
            try {
                // Gọi createBooking() - Tái sử dụng toàn bộ logic
                BookingResponse response = createBooking(bookingRequest);

                // Thêm message chi tiết
                response.setMessage(String.format(
                        " Xe #%d thành công - Trạm: %d - Ngày: %s - Giờ: %s - Số tiền: %.0f VND",
                        bookingRequest.getVehicleId(),
                        bookingRequest.getStationId(),
                        bookingRequest.getBookingDate(),
                        bookingRequest.getTimeSlot(),
                        response.getAmount()
                ));

                successBookings.add(response);
                totalAmount += response.getAmount();

            } catch (Exception e) {
                // Lưu lỗi
                Map<String, Object> failedBooking = new HashMap<>();
                failedBooking.put("vehicleId", bookingRequest.getVehicleId());
                failedBooking.put("stationId", bookingRequest.getStationId());
                failedBooking.put("bookingDate", bookingRequest.getBookingDate());
                failedBooking.put("timeSlot", bookingRequest.getTimeSlot());
                failedBooking.put("success", false);
                failedBooking.put("error", e.getMessage());

                failedBookings.add(failedBooking);
            }
        }

        // Tạo response message
        boolean allSuccess = failedBookings.isEmpty();
        String message;

        if (allSuccess) {
            message = String.format(
                    " Đặt lịch thành công cho tất cả %d xe! Tổng tiền: %.0f VND",
                    successBookings.size(), totalAmount
            );
        } else if (successBookings.isEmpty()) {
            message = " Tất cả booking đều thất bại!";
        } else {
            message = String.format(
                    " Đặt lịch thành công cho %d/%d xe. Tổng tiền: %.0f VND. %d xe thất bại.",
                    successBookings.size(), request.getBookings().size(), totalAmount, failedBookings.size()
            );
        }

        // Return kết quả
        Map<String, Object> result = new HashMap<>();
        result.put("allSuccess", allSuccess);
        result.put("totalVehicles", request.getBookings().size());
        result.put("successCount", successBookings.size());
        result.put("failedCount", failedBookings.size());
        result.put("totalAmount", totalAmount);
        result.put("successBookings", successBookings);
        result.put("failedBookings", failedBookings);
        result.put("message", message);

        return result;
    }
}
