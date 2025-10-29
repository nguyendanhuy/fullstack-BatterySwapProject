package BatterySwapStation.service;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.UserSubscriptionRepository;
import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.entity.SubscriptionPlan;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.User;
import org.springframework.context.event.EventListener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;


@Service
@Transactional
@RequiredArgsConstructor // (Giữ nguyên nếu bạn đang dùng)
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final VehicleRepository vehicleRepository;
    private final SystemPriceService systemPriceService;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    /**
     * Tạo đặt chỗ mới (giới hạn tối đa 1 xe, chỉ 1 trạm, ngày trong 2 ngày, khung giờ hợp lệ)
     * Cho phép 1 user đặt nhiều xe cùng lúc nếu trạm đủ pin
     */
    @PostMapping("/create")
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

        // ========== KIỂM TRA XE CÓ BOOKING CHƯA HOÀN THÀNH (Giữ nguyên) ==========
        if (bookingRepository.hasIncompleteBookingForVehicle(vehicleId)) {
            // (Giữ nguyên logic báo lỗi chi tiết...)
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

        // Kiểm tra ngày đặt chỗ (Giữ nguyên)
        LocalDate now = LocalDate.now();
        if (request.getBookingDate().isBefore(now) || request.getBookingDate().isAfter(now.plusDays(7))) {
            throw new IllegalArgumentException("Ngày đặt pin phải nằm trong vòng 7 ngày kể từ hôm nay.");
        }

        // Chuyển đổi String sang LocalTime (Giữ nguyên)
        if (request.getTimeSlot() == null) {
            throw new IllegalArgumentException("Bạn phải chọn khung giờ.");
        }
        // Chuyển đổi String sang LocalTime (Giữ nguyên)
        LocalTime timeSlot = LocalTime.parse(request.getTimeSlot(), DateTimeFormatter.ofPattern("HH:mm"));

        // Kiểm tra trùng lặp booking (Giữ nguyên)
        if (bookingRepository.existsDuplicateBooking(user, vehicle, station, request.getBookingDate(), timeSlot)) {
            throw new IllegalStateException("Bạn không thể đặt cùng một xe tại cùng một trạm và khung giờ.");
        }

        // Xác định số pin muốn đổi (Giữ nguyên)
        Integer requestedBatteryCount = request.getBatteryCount();
        if (requestedBatteryCount == null) {
            requestedBatteryCount = vehicle.getBatteryCount();
        }


        // ========== [LOGIC MỚI] - KIỂM TRA CÔNG SUẤT TRẠM ==========

        // 1. Lấy tổng số pin đã được đặt (chưa hoàn thành) tại trạm và khung giờ này
        Integer alreadyBookedCount = bookingRepository.getBookedBatteryCountAtTimeSlot(
                station,
                request.getBookingDate(),
                timeSlot
        );
        if (alreadyBookedCount == null) {
            alreadyBookedCount = 0;
        }

        // 2. Lấy tổng công suất của trạm
        Integer stationCapacity = station.getDocks().size(); // <--- ĐÃ SỬA

        // 3. Kiểm tra
        if ((alreadyBookedCount + requestedBatteryCount) > stationCapacity) {
            throw new IllegalStateException(String.format(
                    "Trạm không đủ pin cho khung giờ này. Khung giờ này đã có %d pin được đặt, " +
                            "bạn yêu cầu %d pin, vượt quá công suất trạm (%d).",
                    alreadyBookedCount,
                    requestedBatteryCount,
                    stationCapacity
            ));
        }
        // =============================================================

        // ========== [SỬA ĐỔI] - TÍNH GIÁ DỰA TRÊN GÓI CƯỚC (SUBSCRIPTION) ==========

        // 1. Lấy giá đổi pin tiêu chuẩn (15000)
        Double standardSwapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);
        Double finalBookingPrice = standardSwapPrice * requestedBatteryCount.doubleValue(); // Giá mặc định
        boolean isFreeSwap = false; // Cờ (flag) để theo dõi
        Optional<UserSubscription> activeSub = Optional.empty(); // Biến để lưu sub

        // 2. KIỂM TRA SUBSCRIPTION CỦA USER (user object đã được lấy từ vehicle)
        activeSub = userSubscriptionRepository.findActiveSubscriptionForUser(
                user.getUserId(),
                UserSubscription.SubscriptionStatus.ACTIVE,
                LocalDateTime.now()
        );

        if (activeSub.isPresent()) {
            // User này CÓ gói cước!
            log.info("User {} có gói cước ACTIVE. Đang kiểm tra quyền lợi...", user.getUserId());
            UserSubscription sub = activeSub.get();
            SubscriptionPlan plan = sub.getPlan();

            int limit = (plan.getSwapLimit() == null || plan.getSwapLimit() < 0) ? -1 : plan.getSwapLimit();
            int used = sub.getUsedSwaps();

            // 3. Kiểm tra giới hạn (Limit)
            if (limit == -1) {
                // Gói KHÔNG GIỚI HẠN
                log.info("User {} dùng gói KHÔNG GIỚI HẠN. Áp dụng miễn phí.", user.getUserId());
                finalBookingPrice = 0.0; // Miễn phí!
                isFreeSwap = true;

            } else if (used + requestedBatteryCount <= limit) {
                // Gói CÓ GIỚI HẠN, và còn đủ lượt
                log.info("User {} còn {}/{} lượt. Áp dụng miễn phí.", user.getUserId(), (limit - used), limit);
                finalBookingPrice = 0.0; // Miễn phí!
                isFreeSwap = true;

            } else {
                // Gói CÓ GIỚI HẠN, nhưng đã VƯỢT QUÁ
                log.warn("User {} đã hết {}/{} lượt. Tính phí {} VND cho booking này.",
                        user.getUserId(), used, limit, finalBookingPrice);
                // Không làm gì, 'finalBookingPrice' vẫn là giá 15k
            }
        }

// Lấy vehicleType từ vehicle (Giữ nguyên)
        String vehicleTypeStr = vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN";

// Lấy batteryType (Giữ nguyên)
        String batteryTypeStr = request.getBatteryType();
        if (batteryTypeStr == null || batteryTypeStr.isBlank()) {
            batteryTypeStr = vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : "UNKNOWN";
        }

// ========== LOGIC XỬ LÝ THANH TOÁN MỚI ==========

        Booking.BookingStatus initialBookingStatus;
        Invoice.InvoiceStatus initialInvoiceStatus;
        Payment.PaymentMethod paymentMethodEnum = null;
        Payment.PaymentStatus paymentStatusEnum = null;
        boolean createPaymentRecord = false; // Cờ (flag)
        String paymentMethodRequest = request.getPaymentMethod(); // "WALLET" hoặc "VNPAY"

        if (isFreeSwap) {
            // TRƯỜNG HỢP 1: DÙNG GÓI CƯỚC (0 ĐỒNG)
            log.info("Booking 0đ (Gói cước). Tự động kích hoạt.");
            initialBookingStatus = Booking.BookingStatus.PENDINGSWAPPING;
            initialInvoiceStatus = Invoice.InvoiceStatus.PAID;

            // Không tạo record Payment, vì đây là gói cước
            createPaymentRecord = false;

        } else {
            // TRƯỜNG HỢP 2: TÍNH PHÍ (15.000 ĐỒNG)
            if (paymentMethodRequest == null || paymentMethodRequest.isBlank()) {
                throw new IllegalArgumentException("Phương thức thanh toán là bắt buộc (ví dụ: WALLET hoặc VNPAY).");
            }

            if (paymentMethodRequest.equalsIgnoreCase("WALLET")) {
                // 2a. THANH TOÁN BẰNG VÍ
                log.info("Booking 15.000đ. Xử lý thanh toán qua VÍ.");

                Double userWallet = user.getWalletBalance();
                if (userWallet < finalBookingPrice) {
                    throw new IllegalStateException(String.format(
                            "Số dư ví không đủ. Cần %.0f, số dư: %.0f",
                            finalBookingPrice, userWallet
                    ));
                }

                // Trừ tiền
                user.setWalletBalance(userWallet - finalBookingPrice);
                userRepository.save(user); // Lưu số dư mới

                // Đã thanh toán, sẵn sàng đổi pin
                initialBookingStatus = Booking.BookingStatus.PENDINGSWAPPING;
                initialInvoiceStatus = Invoice.InvoiceStatus.PAID;

                // (Tạo 1 record Payment)
                paymentMethodEnum = Payment.PaymentMethod.WALLET;
                paymentStatusEnum = Payment.PaymentStatus.SUCCESS;
                createPaymentRecord = true;

            } else if (paymentMethodRequest.equalsIgnoreCase("VNPAY")) {
                // 2b. THANH TOÁN BẰNG VNPAY
                log.info("Booking 15.000đ. Chuyển hướng sang VNPAY.");

                // Chờ thanh toán
                initialBookingStatus = Booking.BookingStatus.PENDINGPAYMENT;
                initialInvoiceStatus = Invoice.InvoiceStatus.PENDING;

                // Tạo record Payment ở trạng thái PENDING
                paymentMethodEnum = Payment.PaymentMethod.VNPAY;
                paymentStatusEnum = Payment.PaymentStatus.PENDING;
                createPaymentRecord = true;

            } else {
                // (Bạn có thể thêm CREDIT_CARD hoặc QR_BANKING ở đây nếu muốn)
                throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + paymentMethodRequest);
            }
        }

        // ========== [PHẦN 4 - THAY THẾ] ==========
        // ========== TẠO BOOKING, INVOICE, PAYMENT ==========

        // 1. TẠO INVOICE (Tương thích với Invoice.java mới)
        Invoice invoice = new Invoice();
        invoice.setUserId(user.getUserId());
        invoice.setPricePerSwap(standardSwapPrice); // <-- Dòng bạn đã thêm
        invoice.setTotalAmount(finalBookingPrice);
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(initialInvoiceStatus); // <-- Dùng status đã tính
        invoice.setNumberOfSwaps(requestedBatteryCount);
        invoice.setInvoiceType(Invoice.InvoiceType.BOOKING); // <-- Dùng Enum mới
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 2. TẠO BOOKING
        Booking booking = Booking.builder()
                .user(user)
                .station(station)
                .vehicle(vehicle)
                .vehicleType(vehicleTypeStr)
                .amount(finalBookingPrice)
                .bookingDate(request.getBookingDate())
                .timeSlot(timeSlot)
                .batteryType(batteryTypeStr)
                .batteryCount(requestedBatteryCount)
                .bookingStatus(initialBookingStatus) // <-- Dùng status đã tính
                .notes("Đặt lịch qua API")
                .totalPrice(finalBookingPrice)
                .invoice(savedInvoice) // <-- Liên kết invoice
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // 3. TẠO PAYMENT RECORD (NẾU CẦN)
        if (createPaymentRecord) {
            Payment payment = Payment.builder()
                    .invoice(savedInvoice) // Liên kết tới Invoice
                    .amount(finalBookingPrice)
                    .paymentMethod(paymentMethodEnum)
                    .paymentStatus(paymentStatusEnum)
                    .transactionType(Payment.TransactionType.PAYMENT) // <-- Dùng Enum mới
                    .createdAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);
        }

        // ========== [PHẦN 5 - GIỮ NGUYÊN] ==========
        // ========== TRỪ LƯỢT VÀ TRẢ VỀ RESPONSE ==========

        // TRỪ LƯỢT NẾU LÀ 0 ĐỒNG
        if (isFreeSwap && activeSub.isPresent()) {
            UserSubscription sub = activeSub.get();
            int used = sub.getUsedSwaps();
            sub.setUsedSwaps(used + requestedBatteryCount);
            userSubscriptionRepository.save(sub);
            log.info("Đã trừ {} lượt. User {} còn {}/{} lượt.",
                    requestedBatteryCount, user.getUserId(), (sub.getUsedSwaps()), sub.getPlan().getSwapLimit());
        }

        // Phần trả về Response (Giữ nguyên)
        BookingResponse response;
        if (isFreeSwap && activeSub.isPresent()) {
            response = convertToResponse(savedBooking, activeSub.get());
        } else {
            response = convertToResponse(savedBooking, null);
        }

        // TẠO MESSAGE (Giữ nguyên)
        // (Phần này sẽ cần cập nhật để hiển thị đúng message cho WALLET)
        String createMessage;
        if (isFreeSwap && activeSub.isPresent()) {
            // ... (Message Gói cước của bạn) ...
            createMessage = "Booking (Gói cước) thành công! Trạng thái: PENDINGSWAPPING";
        } else if (paymentMethodRequest != null && paymentMethodRequest.equalsIgnoreCase("WALLET")) {
            // Message mới cho WALLET
            createMessage = String.format(
                    "Booking #%d được thanh toán qua Ví thành công!\n" +
                            "Trạng thái: Chờ đổi pin (PENDINGSWAPPING)\n" +
                            "Tổng tiền: %.0f VND",
                    savedBooking.getBookingId(),
                    savedBooking.getAmount()
            );
        } else {
            // Message cũ cho VNPAY
            createMessage = String.format(
                    "Booking #%d được tạo thành công!\n" +
                            "Trạng thái: Chờ thanh toán (PENDINGPAYMENT)\n" +
                            "Tổng tiền: %.0f VND",
                    savedBooking.getBookingId(),
                    savedBooking.getAmount()
            );
        }

        response.setMessage(createMessage);
        response.setBatteryCount(savedBooking.getBatteryCount());

        return response;
    }


    /**
     * Lấy danh sách đặt chỗ của người dùng
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userId) {

        // 1. Tìm tất cả booking (Code của bạn)
        List<Booking> bookings = bookingRepository.findByUserWithAllDetails(userId); // (Hoặc query cũ của bạn)

        // 2. Chuyển đổi (convert) TỪNG booking
        return bookings.stream()
                .map(booking -> {
                    // 3. [LOGIC "THÔNG MINH"]
                    UserSubscription subscription = null; // Mặc định là null

                    // Kiểm tra xem có cần tìm Subscription không
                    if (booking.getTotalPrice() != null &&
                            booking.getTotalPrice() == 0.0 &&
                            booking.getInvoice() != null &&
                            booking.getInvoice().getCreatedDate() != null) {

                        Optional<UserSubscription> subOpt = userSubscriptionRepository.findActiveSubscriptionForUserOnDate(
                                booking.getUser().getUserId(),
                                UserSubscription.SubscriptionStatus.ACTIVE,
                                booking.getInvoice().getCreatedDate()
                        );

                        if (subOpt.isPresent()) {
                            subscription = subOpt.get(); // Tìm thấy gói cước
                        }
                    }

                    // 4. Gọi hàm helper của BẠN (với 2 tham số)
                    return convertToResponse(booking, subscription);

                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBookingById(Long bookingId) {
        // 1. Tìm Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking với ID: " + bookingId));

        // 2. Gọi hàm trợ giúp "thông minh"
        return convertBookingToMap(booking);
    }

    /**
     * Chuyển 1 Booking sang Map, tự động tìm và đính kèm thông tin gói cước (Subscription) nếu có.
     */
    @Transactional(readOnly = true)
    protected Map<String, Object> convertBookingToMap(Booking booking) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("bookingId", booking.getBookingId());
        result.put("bookingStatus", booking.getBookingStatus().name());
        result.put("bookingDate", booking.getBookingDate());
        result.put("timeSlot", booking.getTimeSlot());
        result.put("amount", booking.getAmount());
        result.put("batteryType", booking.getBatteryType());
        result.put("batteryCount", booking.getBatteryCount());

        // Thông tin khách hàng
        if (booking.getUser() != null) {
            result.put("userId", booking.getUser().getUserId());
            result.put("fullName", booking.getUser().getFullName());
            result.put("email", booking.getUser().getEmail());
            result.put("phone", booking.getUser().getPhone());
        }

        // Thông tin xe
        if (booking.getVehicle() != null) {
            result.put("vehicleId", booking.getVehicle().getVehicleId());
            result.put("vehicleVin", booking.getVehicle().getVIN());
            result.put("vehicleType", booking.getVehicle().getVehicleType().toString());
            result.put("licensePlate", booking.getVehicle().getLicensePlate());
        }

        // Thông tin trạm
        if (booking.getStation() != null) {
            result.put("stationId", booking.getStation().getStationId());
            result.put("stationName", booking.getStation().getStationName());
            result.put("stationAddress", booking.getStation().getAddress());
        }

        // Thông tin thanh toán
        if (booking.getInvoice() != null) {
            result.put("invoiceId", booking.getInvoice().getInvoiceId());
            result.put("totalAmount", booking.getInvoice().getTotalAmount());
            result.put("invoiceStatus", booking.getInvoice().getInvoiceStatus().name());
        }

        // ========== [LOGIC "THÔNG MINH" NẰM Ở ĐÂY] ==========

        // Đặt mặc định
        result.put("isFreeSwap", false);
        result.put("subscriptionPlanName", null);
        result.put("remainingSwaps", null);
        result.put("totalSwapLimit", null);

        // Kiểm tra và thêm thông tin gói cước
        if (booking.getInvoice() != null &&
                booking.getInvoice().getTotalAmount() != null &&
                booking.getInvoice().getTotalAmount() == 0.0 && // Kiểm tra miễn phí
                booking.getUser() != null &&
                booking.getInvoice().getCreatedDate() != null) {

            Optional<UserSubscription> subOpt = userSubscriptionRepository.findActiveSubscriptionForUserOnDate(
                    booking.getUser().getUserId(),
                    UserSubscription.SubscriptionStatus.ACTIVE,
                    booking.getInvoice().getCreatedDate()
            );

            if (subOpt.isPresent()) {
                UserSubscription sub = subOpt.get();
                SubscriptionPlan plan = sub.getPlan();

                int limit = (plan.getSwapLimit() == null || plan.getSwapLimit() < 0) ? -1 : plan.getSwapLimit();
                int remaining = limit == -1 ? -1 : (limit - sub.getUsedSwaps());

                result.put("isFreeSwap", true); // Ghi đè (true)
                result.put("subscriptionPlanName", plan.getPlanName());
                result.put("remainingSwaps", remaining);
                result.put("totalSwapLimit", limit);
            }
        }
        // ===============================================

        return result;
    }


    /**
     * Hủy đặt chỗ
     */
    @Transactional
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

        // Kiểm tra thời gian hủy
        LocalDateTime scheduledDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getTimeSlot());
        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime minimumCancelTime = scheduledDateTime.minusHours(1);
        if (currentDateTime.isAfter(minimumCancelTime)) {
            throw new IllegalStateException(String.format(
                    "Không thể hủy booking. Chỉ có thể hủy trước ít nhất 1 tiếng so với thời gian đặt (%s %s). Giới hạn: %s",
                    booking.getBookingDate(), booking.getTimeSlot(), minimumCancelTime));
        }

        // ✅ Hủy và lưu lý do
        booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(request.getCancelReason());
        Booking savedBooking = bookingRepository.save(booking);

        // ✅ Tự động hoàn tiền về ví nếu booking có hóa đơn và payment thành công
        Invoice invoice = booking.getInvoice();
        if (invoice != null && invoice.getPayments() != null && !invoice.getPayments().isEmpty()) {

            // Lấy payment thành công gần nhất
            Payment successfulPayment = invoice.getPayments().stream()
                    .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESS)
                    .max(Comparator.comparing(Payment::getCreatedAt))
                    .orElse(null);

            if (successfulPayment != null) {
                double refundAmount = booking.getAmount();

                // ✅ Tạo bản ghi Payment REFUND
                Payment refund = Payment.builder()
                        .amount(refundAmount)
                        .paymentMethod(Payment.PaymentMethod.WALLET)
                        .paymentStatus(Payment.PaymentStatus.SUCCESS)
                        .transactionType(Payment.TransactionType.REFUND)
                        .gateway("INTERNAL_WALLET")
                        .invoice(invoice)
                        .message("Hoàn tiền cho booking #" + booking.getBookingId() + " về ví trung gian")
                        .createdAt(LocalDateTime.now())
                        .build();

                paymentRepository.save(refund);

                // ✅ Cộng tiền ví người dùng
                user.setWalletBalance(user.getWalletBalance() + refundAmount);
                userRepository.save(user);
            }
        }

        // ✅ Trả về response
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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lượt đặt pin với mã: " + bookingId));

        // Cập nhật trạng thái booking thành COMPLETED
        booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedTime(LocalDate.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Tạo thông báo thành công
        String successMessage = String.format(
            "Booking #%d được hoàn thành thành công. Tổng tiền: %.0f VND",
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
            Double swapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);
            Double expectedAmount = swapPrice * request.getQuantity();
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
     * Convert Booking entity sang BookingResponse DTO (với thông tin subscription)
     */
    private BookingResponse convertToResponse(Booking booking, UserSubscription subscription) {
        BookingResponse response = new BookingResponse();

        // Thông tin booking cơ bản
        response.setBookingId(booking.getBookingId());
        response.setBookingStatus(booking.getBookingStatus().name());
        response.setAmount(booking.getAmount());
        response.setBookingDate(booking.getBookingDate());

        // Chuyển đổi LocalTime
        if (booking.getTimeSlot() != null) {
            response.setTimeSlot(LocalTime.parse(booking.getTimeSlot().format(DateTimeFormatter.ofPattern("HH:mm"))));
        }

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
            response.setVehicleType(booking.getVehicle().getVehicleType().name());
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
            response.setInvoiceId(String.valueOf(booking.getInvoice().getInvoiceId()));
        }

        // ✅ THÔNG TIN GÓI CƯỚC (sử dụng subscription đã truyền vào)
        if (subscription != null) {
            SubscriptionPlan plan = subscription.getPlan();

            int limit = (plan.getSwapLimit() == null || plan.getSwapLimit() < 0) ? -1 : plan.getSwapLimit();
            int remaining = limit == -1 ? -1 : limit - subscription.getUsedSwaps();

            response.setIsFreeSwap(true);
            response.setSubscriptionPlanName(plan.getPlanName());
            response.setRemainingSwaps(remaining);
            response.setTotalSwapLimit(limit);
        } else {
            response.setIsFreeSwap(false);
            response.setSubscriptionPlanName(null);
            response.setRemainingSwaps(null);
            response.setTotalSwapLimit(null);
        }

        // Thông tin thanh toán
        if (booking.getInvoice() != null && booking.getInvoice().getPayments() != null) {
            Payment paymentToShow = booking.getInvoice().getPayments().stream()
                    .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESS)
                    .findFirst()
                    .orElse(
                            booking.getInvoice().getPayments().stream()
                                    .max(Comparator.comparing(Payment::getCreatedAt))
                                    .orElse(null)
                    );

            if (paymentToShow != null) {
                BookingResponse.PaymentInfo paymentInfoDTO = new BookingResponse.PaymentInfo();
                paymentInfoDTO.setPaymentId(paymentToShow.getPaymentId());
                paymentInfoDTO.setPaymentMethod(paymentToShow.getPaymentMethod().name());
                paymentInfoDTO.setAmount(paymentToShow.getAmount());
                paymentInfoDTO.setPaymentStatus(paymentToShow.getPaymentStatus().name());

                if (paymentToShow.getCreatedAt() != null) {
                    paymentInfoDTO.setPaymentDate(paymentToShow.getCreatedAt());
                }

                response.setPayment(paymentInfoDTO);
            } else {
                response.setPayment(null);
            }
        } else {
            response.setPayment(null);
        }

        return response;
    }

    /**
     * Overload method cũ để backward compatibility
     */
    private BookingResponse convertToResponse(Booking booking) {
        return convertToResponse(booking, null);
    }


    /**
     * Tính toán giá tiền đặt chỗ dựa trên SystemPrice - THỐNG NHẤT CHO TẤT CẢ
     */
    private Double calculateBookingAmountByVehicleBatteryType(Vehicle vehicle) {
        // Lấy giá thống nhất từ SystemPrice (không phân biệt loại pin)
        double basePrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);

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
     * Tạo flexible batch booking - GỘP HÓA ĐƠN
     * Nếu 1 booking lỗi, toàn bộ batch sẽ rollback.
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createFlexibleBatchBooking(FlexibleBatchBookingRequest request) {

        // (Lấy UserID từ request.getUserId())
        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("UserId là bắt buộc cho batch booking.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User: " + userId));

        log.info("Bắt đầu xử lý Batch Booking cho UserID: {}", user.getUserId());

        // ========== [LƯỢT 1: KIỂM TRA & TÍNH TOÁN] ==========
        // (Phần này giữ nguyên 100% - nó đã hoạt động đúng)

        Double standardSwapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);
        if (standardSwapPrice == null) {
            log.error("LỖI HỆ THỐNG: Không tìm thấy giá 'BATTERY_SWAP' trong systemprice.");
            throw new IllegalStateException("Không thể xác định giá đổi pin. Vui lòng liên hệ quản trị viên.");
        }
        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository.findActiveSubscriptionForUser(
                user.getUserId(), UserSubscription.SubscriptionStatus.ACTIVE, LocalDateTime.now()
        );
        double totalCost = 0.0;
        int totalSwapsNeeded = 0;
        int currentUsedSwaps = 0;
        int currentSwapLimit = 0;
        boolean hasActivePlan = false;
        if (activeSubOpt.isPresent()) {
            UserSubscription sub = activeSubOpt.get();
            SubscriptionPlan plan = sub.getPlan();
            if (plan != null) {
                hasActivePlan = true;
                currentUsedSwaps = sub.getUsedSwaps();
                currentSwapLimit = (plan.getSwapLimit() == null || plan.getSwapLimit() < 0) ? 0 : plan.getSwapLimit();
            } else {
                log.warn("UserSubscription #{} không có 'plan' (plan=null). Coi như không có gói.", sub.getId());
            }
        }
        List<BookingDataHelper> validatedBookings = new ArrayList<>();
        for (BookingRequest req : request.getBookings()) {
            Station station = stationRepository.findById(req.getStationId())
                    .orElseThrow(() -> new EntityNotFoundException("Trạm không tồn tại: " + req.getStationId()));
            Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                    .orElseThrow(() -> new EntityNotFoundException("Xe không tồn tại: " + req.getVehicleId()));
            if (!vehicle.getUser().getUserId().equals(user.getUserId())) {
                throw new IllegalStateException("Xe " + vehicle.getVIN() + " không thuộc về user " + user.getUserId());
            }
            LocalTime timeSlot = LocalTime.parse(req.getTimeSlot(), DateTimeFormatter.ofPattern("HH:mm"));
            if (bookingRepository.hasIncompleteBookingForVehicle(vehicle.getVehicleId())) {
                throw new IllegalStateException("Xe " + vehicle.getVIN() + " đang có booking chưa hoàn thành.");
            }
            Integer reqCount = (req.getBatteryCount() != null) ? req.getBatteryCount() : vehicle.getBatteryCount();
            Integer alreadyBooked = bookingRepository.getBookedBatteryCountAtTimeSlot(station, req.getBookingDate(), timeSlot);
            if (alreadyBooked == null) alreadyBooked = 0;
            if ((alreadyBooked + reqCount) > station.getDocks().size()) {
                throw new IllegalStateException("Trạm " + station.getStationName() + " đã hết chỗ vào " + timeSlot);
            }
            boolean isFree = false;
            String batteryTypeStr = (req.getBatteryType() != null && !req.getBatteryType().isBlank())
                    ? req.getBatteryType()
                    : (vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : "UNKNOWN");
            String vehicleTypeStr = vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : "UNKNOWN";
            if (hasActivePlan && (currentUsedSwaps + totalSwapsNeeded + reqCount) <= currentSwapLimit) {
                isFree = true;
                totalSwapsNeeded += reqCount;
            } else {
                isFree = false;
                totalCost += (standardSwapPrice * reqCount);
            }
            validatedBookings.add(new BookingDataHelper(
                    req, station, vehicle, timeSlot,
                    reqCount, isFree, (isFree ? 0.0 : standardSwapPrice * reqCount),
                    batteryTypeStr, vehicleTypeStr
            ));
        }


        // ========== [LƯỢT 2: SỬA LỖI LOGIC GỘP INVOICE] ==========

        String paymentMethodRequest = request.getPaymentMethod();
        Payment.PaymentMethod paymentMethodEnum = null;
        Payment.PaymentStatus paymentStatusEnum = null;
        Invoice.InvoiceStatus invoiceStatusEnum = Invoice.InvoiceStatus.PENDING;

        // 1. Xử lý thanh toán 1 LẦN DUY NHẤT
        if (totalCost > 0) {
            log.info("Batch booking, tổng chi phí: {}. Đang xử lý thanh toán...", totalCost);
            if (paymentMethodRequest == null || paymentMethodRequest.isBlank()) {
                throw new IllegalArgumentException("Batch này có tính phí. Phương thức thanh toán là bắt buộc (WALLET hoặc VNPAY).");
            }
            if (paymentMethodRequest.equalsIgnoreCase("WALLET")) {
                Double userWallet = user.getWalletBalance();
                if (userWallet < totalCost) {
                    throw new IllegalStateException(String.format(
                            "Số dư ví không đủ. Cần %.0f, số dư: %.0f", totalCost, userWallet
                    ));
                }
                user.setWalletBalance(userWallet - totalCost);

                // ✅ [SỬA VẤN ĐỀ 3] - Dòng này BẮT BUỘC phải có
                userRepository.save(user);

                paymentMethodEnum = Payment.PaymentMethod.WALLET;
                paymentStatusEnum = Payment.PaymentStatus.SUCCESS;
                invoiceStatusEnum = Invoice.InvoiceStatus.PAID;
            } else if (paymentMethodRequest.equalsIgnoreCase("VNPAY")) {
                paymentMethodEnum = Payment.PaymentMethod.VNPAY;
                paymentStatusEnum = Payment.PaymentStatus.PENDING;
                invoiceStatusEnum = Invoice.InvoiceStatus.PENDING;
            } else {
                throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + paymentMethodRequest);
            }
        } else {
            log.info("Batch booking, tổng chi phí: 0.0 (Gói cước).");
            invoiceStatusEnum = Invoice.InvoiceStatus.PAID;
        }

        // 2. Trừ lượt gói cước (1 LẦN DUY NHẤT)
        if (totalSwapsNeeded > 0 && activeSubOpt.isPresent()) {
            UserSubscription sub = activeSubOpt.get();
            sub.setUsedSwaps(sub.getUsedSwaps() + totalSwapsNeeded);
            userSubscriptionRepository.save(sub);
            log.info("Đã trừ {} lượt gói cước cho batch. Tổng lượt đã dùng: {}", totalSwapsNeeded, sub.getUsedSwaps());
        }

        // 3. TẠO 1 INVOICE CHUNG
        Invoice masterInvoice = new Invoice();
        masterInvoice.setUserId(user.getUserId());
        masterInvoice.setTotalAmount(totalCost);
        masterInvoice.setCreatedDate(LocalDateTime.now());
        masterInvoice.setInvoiceStatus(invoiceStatusEnum);
        int totalSwapsInBatch = validatedBookings.stream().mapToInt(b -> b.batteryCount).sum();
        masterInvoice.setNumberOfSwaps(totalSwapsInBatch);
        masterInvoice.setInvoiceType(Invoice.InvoiceType.BOOKING);

        // ✅ [SỬA VẤN ĐỀ 1] - Thêm giá cơ bản (15000)
        masterInvoice.setPricePerSwap(standardSwapPrice);

        Invoice savedMasterInvoice = invoiceRepository.save(masterInvoice);

        // 4. TẠO 1 PAYMENT CHUNG
        if (totalCost > 0 && paymentMethodEnum != null) {
            Payment masterPayment = Payment.builder()
                    .invoice(savedMasterInvoice)
                    .amount(totalCost)
                    .paymentMethod(paymentMethodEnum)
                    .paymentStatus(paymentStatusEnum)
                    .transactionType(Payment.TransactionType.PAYMENT)
                    .createdAt(LocalDateTime.now())

                    // ✅ [SỬA VẤN ĐỀ 2] - Thêm gateway (cho WALLET hoặc VNPAY)
                    .gateway(paymentMethodEnum == Payment.PaymentMethod.WALLET ? "WALLET" : "VNPAY")

                    .build();
            paymentRepository.save(masterPayment);
        }

        // 5. LƯU TẤT CẢ BOOKING
        List<BookingResponse> successBookings = new ArrayList<>();
        for (BookingDataHelper helper : validatedBookings) {
            Booking booking = Booking.builder()
                    .user(user)
                    .station(helper.station)
                    .vehicle(helper.vehicle)
                    .amount(helper.price)
                    .totalPrice(helper.price)
                    .bookingDate(helper.request.getBookingDate())
                    .timeSlot(helper.timeSlot)
                    .batteryCount(helper.batteryCount)
                    .batteryType(helper.batteryType)
                    .vehicleType(helper.vehicleType)
                    .bookingStatus(helper.isFree ? Booking.BookingStatus.PENDINGSWAPPING :
                            (invoiceStatusEnum == Invoice.InvoiceStatus.PAID ? Booking.BookingStatus.PENDINGSWAPPING : Booking.BookingStatus.PENDINGPAYMENT))
                    .invoice(savedMasterInvoice) // <-- Liên kết tới Invoice chung
                    .notes(helper.request.getNotes() != null ? helper.request.getNotes() : "Batch booking")
                    .build();
            Booking savedBooking = bookingRepository.save(booking);
            successBookings.add(convertToResponse(savedBooking, (helper.isFree ? activeSubOpt.orElse(null) : null)));
        }

        // 6. Trả về Response
        Map<String, Object> result = new HashMap<>();
        result.put("message", String.format("Đặt lịch thành công cho %d xe.", successBookings.size()));
        result.put("totalAmount", totalCost);
        result.put("totalSwapsUsed", totalSwapsNeeded);
        result.put("paymentMethod", paymentMethodRequest);
        result.put("bookings", successBookings);

        return result;
    }

    /**
     * Lớp/Record nội bộ (Helper) để lưu trữ dữ liệu đã xác thực ở Lượt 1
     */
    private record BookingDataHelper(
            BookingRequest request,
            Station station,
            Vehicle vehicle,
            LocalTime timeSlot,
            int batteryCount,
            boolean isFree,
            double price,
            String batteryType,
            String vehicleType
    ) {}


    /**
     * Xóa một hoặc nhiều booking cùng lúc (bất kể trạng thái)
     * Đây là API xóa duy nhất, xử lý cả trường hợp 1 ID và nhiều ID.
     * @param bookingIds Danh sách ID của các booking cần xóa
     * @return Map chứa số lượng đã xóa (deleted) và không tìm thấy (notFound)
     */
    @Transactional
    public Map<String, Integer> deleteBookings(List<Long> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) {
            // Trả về map rỗng nếu không có gì để làm
            return Map.of("deleted", 0, "notFound", 0);
        }

        // 1. Tìm tất cả booking hợp lệ từ danh sách ID
        List<Booking> bookingsToDelete = bookingRepository.findAllById(bookingIds);

        int foundCount = bookingsToDelete.size();
        int notFoundCount = bookingIds.size() - foundCount;

        if (bookingsToDelete.isEmpty()) {
            // Không tìm thấy booking nào
            return Map.of("deleted", 0, "notFound", notFoundCount);
        }

        // 2. Lấy ra danh sách (Set) các Invoice duy nhất bị ảnh hưởng
        Set<Invoice> affectedInvoices = bookingsToDelete.stream()
                .map(Booking::getInvoice)   // Lấy invoice của từng booking
                .filter(Objects::nonNull) // Bỏ qua các booking không có invoice
                .collect(Collectors.toSet()); // Thu thập lại (Set sẽ tự lọc trùng)

        // 3. Gỡ link booking khỏi invoice (trong bộ nhớ)
        // Cần làm điều này TRƯỚC KHI xóa
        for (Booking booking : bookingsToDelete) {
            if (booking.getInvoice() != null) {
                // Gỡ link khỏi collection của Invoice
                booking.getInvoice().getBookings().remove(booking);
                // Gỡ link khỏi chính booking
                booking.setInvoice(null);
            }
        }

        // 4. Xóa tất cả booking trong 1 câu lệnh
        bookingRepository.deleteAll(bookingsToDelete);

        // 5. Tính toán lại các invoice đã bị ảnh hưởng
        for (Invoice invoice : affectedInvoices) {
            // Hàm này sẽ tính lại dựa trên 'invoice.getBookings()' đã bị giảm
            invoice.calculateTotalAmount();
            invoiceRepository.save(invoice);
        }

        // 6. Trả về kết quả
        return Map.of("deleted", foundCount, "notFound", notFoundCount);
    }

    @Transactional
    public Map<String, Object> cancelBookingWithRefund(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + bookingId));

        // 🔸 Nếu chưa thanh toán thì chỉ hủy booking
        if (booking.getInvoice() == null
                || booking.getInvoice().getInvoiceStatus() != Invoice.InvoiceStatus.PAID) {
            booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
            booking.setCancellationReason("Hủy booking chưa thanh toán.");
            bookingRepository.save(booking);
            return Map.of(
                    "bookingId", bookingId,
                    "status", "CANCELLED",
                    "message", "Đã hủy booking (chưa thanh toán)"
            );
        }

        // 🔹 Nếu hóa đơn đã thanh toán → gọi refund VNPay
        Map<String, Object> refundResult = paymentService.refundBooking(String.valueOf(bookingId));

        // ✅ Tìm payment tương ứng với booking để set REFUNDED
        Invoice invoice = booking.getInvoice();
        if (invoice != null && invoice.getPayments() != null) {
            invoice.getPayments().stream()
                    .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESS)
                    .reduce((first, second) -> second)
                    .ifPresent(p -> {
                        p.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
                        p.setMessage("Đã hoàn tiền cho booking #" + bookingId);
                    });
        }

        // ✅ Booking chỉ set CANCELLED
        booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason("Đã hủy và hoàn tiền VNPay.");
        bookingRepository.save(booking);

        return Map.of(
                "bookingId", bookingId,
                "status", "CANCELLED",
                "message", "Đã hủy booking và hoàn tiền thành công",
                "refundResult", refundResult
        );
    }


    /**
     * Lấy danh sách booking theo trạng thái
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
     * [SỬA LỖI VÒNG LẶP]
     * Hàm này LẮNG NGHE sự kiện 'InvoicePaidEvent' (được bắn ra từ SubscriptionService HOẶC PaymentService).
     * Khi nó nghe thấy, nó sẽ tự động kích hoạt Booking.
     */
    @EventListener
    public void handleInvoicePaidEvent(InvoicePaidEvent event) {
            Invoice invoice = event.getInvoice();
            log.info("BookingService đã nhận được InvoicePaidEvent cho Invoice #{}", invoice.getInvoiceId());

        // Tìm các booking liên quan đến hóa đơn này
        List<Booking> bookings = bookingRepository.findByInvoice(invoice);
        if (bookings.isEmpty()) {
            // (Nếu đây là Invoice Gói tháng, nó sẽ không có booking nào, đây là việc bình thường)
            log.info("Sự kiện Invoice PAID, không tìm thấy Booking nào liên kết (có thể là HĐ Gói tháng). Bỏ qua.");
            return;
        }

        for (Booking booking : bookings) {
            // Chỉ kích hoạt các booking đang chờ thanh toán
            if (booking.getBookingStatus() == Booking.BookingStatus.PENDINGPAYMENT) {
                log.info("Kích hoạt Booking #{} (từ sự kiện) sang PENDINGSWAPPING", booking.getBookingId());

                // Gọi hàm confirmPayment (Dòng 307 trong file này)
                confirmPayment(booking.getBookingId());
            }
        }
    }

    /**
     * Chỉ định phương thức thanh toán.
     * Người dùng phải gửi: "WALLET" hoặc "VNPAY"
     * (Nếu dùng gói cước 0 đồng, trường này có thể bỏ qua)
     */
    @Setter
    @Getter
    private String paymentMethod;


}

