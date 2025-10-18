package BatterySwapStation.service;

import BatterySwapStation.dto.BookingRequest;
import BatterySwapStation.dto.BookingResponse;
import BatterySwapStation.dto.CancelBookingRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
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
    private final ObjectMapper objectMapper; // Thêm ObjectMapper
    private final BatteryRepository batteryRepository; // Thêm BatteryRepository

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
        LocalTime timeSlot = LocalTime.parse(request.getTimeSlot(), java.time.format.DateTimeFormatter.ofPattern("HH:mm"));

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

        // Tính giá tiền dựa trên loại pin của xe - SỬ DỤNG GIÁ THỰC TẾ TỪ BATTERY ENTITY
        Double bookingAmount = calculateBookingAmountByVehicleBatteryType(vehicle);

        // Lấy vehicleType từ vehicle
        String vehicleTypeStr = vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN";

        // Tạo đặt chỗ mới
        Booking booking = Booking.builder()
                .user(user)
                .station(station)
                .vehicle(vehicle)
                .vehicleType(vehicleTypeStr) // Lưu loại xe
                .amount(bookingAmount) // Lưu giá tiền
                .bookingDate(request.getBookingDate())
                .timeSlot(timeSlot)
                .bookingStatus(Booking.BookingStatus.PENDINGPAYMENT)  // Chỉ dùng bookingStatus
                .notes("Đặt lịch qua API")
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // Tạo các mục pin nếu có
        if (request.getBatteryItems() != null && !request.getBatteryItems().isEmpty()) {
            String batteryItemsJson = processBatteryItems(request.getBatteryItems(), station);
            booking.setBatteryItems(batteryItemsJson);

            // Cập nhật giá tiền nếu có battery items cụ thể
            Double batteryItemsAmount = calculateBatteryItemsAmount(request.getBatteryItems());
            if (batteryItemsAmount > 0) {
                booking.setAmount(batteryItemsAmount);
            }
        }

        // Tạo thông báo thành công khi tạo booking với tổng tiền
        BookingResponse response = convertToResponse(savedBooking);
        String createMessage = String.format(
            "Booking #%d được tạo thành công! Tổng tiền: %.0f VND",
            savedBooking.getBookingId(),
            savedBooking.getAmount()
        );
        response.setMessage(createMessage);

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
    public BookingResponse markBookingAsFailed(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));
        if (booking.getBookingStatus() != Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Chỉ có thể chuyển sang FAILED khi trạng thái hiện tại là PENDINGPAYMENT");
        }
        booking.setBookingStatus(Booking.BookingStatus.FAILED);
        Booking savedBooking = bookingRepository.save(booking);
        return convertToResponse(savedBooking);
    }

    /**
     * Chuyển đổi Booking entity thành BookingResponse DTO
     */
    private BookingResponse convertToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setBookingId(booking.getBookingId());
        response.setUserId(booking.getUser().getUserId());
        response.setUserName(booking.getUser().getFullName());
        response.setStationId(booking.getStation().getStationId());
        response.setStationName(booking.getStation().getStationName());
        response.setStationAddress(booking.getStation().getAddress());

        if (booking.getVehicle() != null) {
            response.setVehicleId(booking.getVehicle().getVehicleId());
            response.setVehicleVin(booking.getVehicle().getVIN());
        }

        // Thêm vehicleType và amount
        response.setVehicleType(booking.getVehicleType());
        response.setAmount(booking.getAmount());

        // Sử dụng bookingDate và timeSlot trực tiếp
        response.setBookingDate(booking.getBookingDate());
        response.setTimeSlot(booking.getTimeSlot());

        // Xử lý null cho bookingStatus
        response.setBookingStatus(booking.getBookingStatus() != null ?
            booking.getBookingStatus().toString() : "PENDING");

        // TODO: Thêm mapping các mục pin
        // TODO: Thêm mapping thông tin thanh toán

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

    // Cập nhật method calculateBatteryPrice để sử dụng giá thống nhất
    private double calculateBatteryPrice(String batteryType) {
        // Bỏ qua batteryType vì giờ tất cả đều dùng chung 1 giá từ SystemPrice
        return systemPriceService.getCurrentPrice();
    }

    // Method tính giá từ Battery object - ưu tiên custom price, fallback SystemPrice
    private double calculateBatteryPrice(Battery battery) {
        Double customPrice = battery.getCalculatedPrice();
        if (customPrice != null) {
            return customPrice;
        }

        // Sử dụng giá thống nhất từ SystemPrice (không phân biệt loại pin)
        return systemPriceService.getCurrentPrice();
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

        // Kiểm tra xe có booking đang hoạt động không
        LocalDate currentDate = LocalDate.now();
        boolean hasActiveBooking = vehicle.getUser() != null &&
                bookingRepository.existsActiveBookingForUserByDate(vehicle.getUser(), currentDate);
        vehicleDetail.put("hasActiveBooking", hasActiveBooking);

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

            // Kiểm tra user có booking đang hoạt động không
            LocalDate currentDate = LocalDate.now();
            if (bookingRepository.existsActiveBookingForUserByDate(vehicle.getUser(), currentDate)) {
                return false;
            }

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
     * Xử lý danh sách battery items và chuyển thành JSON string
     */
    private String processBatteryItems(List<String> batteryItemIds, Station station) {
        try {
            List<java.util.Map<String, Object>> batteryItemsInfo = new java.util.ArrayList<>();

            for (String batteryId : batteryItemIds) {
                // Kiểm tra battery có tồn tại không
                Battery battery = batteryRepository.findById(batteryId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy pin với ID: " + batteryId));

                // Kiểm tra battery có khả dụng không
                if (battery.getBatteryStatus() != Battery.BatteryStatus.AVAILABLE) {
                    throw new IllegalStateException("Pin " + batteryId + " không khả dụng để đặt");
                }

                // Tạo thông tin battery item
                java.util.Map<String, Object> batteryInfo = new java.util.HashMap<>();
                batteryInfo.put("batteryId", battery.getBatteryId());
                batteryInfo.put("batteryType", battery.getBatteryType().toString());
                batteryInfo.put("price", calculateBatteryPrice(battery));
                batteryInfo.put("status", battery.getBatteryStatus().toString());

                batteryItemsInfo.add(batteryInfo);
            }

            // Chuyển thành JSON string
            return objectMapper.writeValueAsString(batteryItemsInfo);

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Lỗi khi xử lý thông tin battery items: " + e.getMessage(), e);
        }
    }

    /**
     * Tính tổng giá tiền cho các battery items
     */
    private Double calculateBatteryItemsAmount(List<String> batteryItemIds) {
        double totalAmount = 0.0;

        for (String batteryId : batteryItemIds) {
            try {
                Battery battery = batteryRepository.findById(batteryId).orElse(null);
                if (battery != null) {
                    totalAmount += calculateBatteryPrice(battery);
                } else {
                    // Nếu không tìm thấy battery, sử dụng gi�� mặc định
                    totalAmount += systemPriceService.getCurrentPrice();
                }
            } catch (Exception e) {
                // Nếu có lỗi, sử dụng giá mặc định
                totalAmount += systemPriceService.getCurrentPrice();
            }
        }

        return totalAmount;
    }
}
