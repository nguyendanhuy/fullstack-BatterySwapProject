package BatterySwapStation.service;

import BatterySwapStation.config.VnPayProperties;
import BatterySwapStation.dto.VnPayCreatePaymentRequest;
import BatterySwapStation.dto.WalletTopupRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import BatterySwapStation.entity.Invoice.InvoiceType;
import BatterySwapStation.entity.Payment.PaymentMethod;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import BatterySwapStation.utils.VnPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final VnPayProperties props;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final SubscriptionService subscriptionService;
    private final SystemPriceRepository systemPriceRepository;
    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    /**
     * 1️⃣ Tạo URL thanh toán (FE gọi)
     * 👉 Chỉ tạo Payment với trạng thái PENDING, chưa update DB khác.
     */
    @Transactional
    public String createVnPayPaymentUrlByInvoice(VnPayCreatePaymentRequest req, HttpServletRequest http) {
        log.info("🟢 [CREATE] Bắt đầu tạo URL thanh toán cho invoiceId={}", req.getInvoiceId());

        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn: " + req.getInvoiceId()));

        double amount = Optional.ofNullable(invoice.getTotalAmount()).orElse(0d);
        if (amount <= 0)
            throw new IllegalArgumentException("Hóa đơn phải có giá trị lớn hơn 0");

        boolean alreadyPaid = paymentRepository.existsByInvoiceAndPaymentStatus(invoice, Payment.PaymentStatus.SUCCESS);
        if (alreadyPaid)
            throw new IllegalStateException("Hóa đơn đã được thanh toán");

        String ipAddr = VnPayUtils.getClientIp(http);
        String txnRef = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        long amountTimes100 = Math.round(amount) * 100L;

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zone);

        String vnpCreateDate = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String vnpExpireDate = now.plusMinutes(props.getExpireMinutes())
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", props.getApiVersion());
        params.put("vnp_Command", props.getCommand());
        params.put("vnp_TmnCode", props.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountTimes100));
        params.put("vnp_CurrCode", props.getCurrCode());
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toán hóa đơn #" + invoice.getInvoiceId());
        params.put("vnp_OrderType", req.getOrderType());
        params.put("vnp_Locale", (req.getLocale() == null || req.getLocale().isBlank()) ? "vn" : req.getLocale());
        params.put("vnp_ReturnUrl", props.getReturnUrl());
        params.put("vnp_IpAddr", ipAddr);
        params.put("vnp_CreateDate", vnpCreateDate);
        params.put("vnp_ExpireDate", vnpExpireDate);
        if (req.getBankCode() != null && !req.getBankCode().isBlank()) {
            params.put("vnp_BankCode", req.getBankCode());
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .transactionType(Payment.TransactionType.PAYMENT)
                .gateway("VNPAY")
                .vnpTxnRef(txnRef)
                .createdAt(LocalDateTime.now(zone))
                .build();

        paymentRepository.save(payment);
        String payUrl = VnPayUtils.buildPaymentUrl(props.getPayUrl(), params, props.getHashSecret());
        log.info("✅ [CREATE DONE] Invoice #{} | TxnRef={} | Amount={} | IP={} | URL={}",
                invoice.getInvoiceId(), txnRef, amount, ipAddr, payUrl);

        return payUrl;
    }
    /**
     * 2️⃣ IPN callback (VNPAY → BE)
     * 👉 Xử lý chính thức: cập nhật DB, trạng thái hóa đơn & booking.
     */
    @Transactional
    public Map<String, String> handleVnPayIpn(Map<String, String> query) {
        log.info("[IPN RECEIVED] {}", query);
        Map<String, String> response = new HashMap<>();

        try {
            Map<String, String> fields = new HashMap<>(query);
            String secureHash = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            String signed = VnPayUtils.hmacSHA512(props.getHashSecret(), VnPayUtils.buildDataToSign(fields));
            if (!signed.equalsIgnoreCase(secureHash)) {
                response.put("RspCode", "97");
                response.put("Message", "Checksum không hợp lệ");
                return response;
            }

            String txnRef = fields.get("vnp_TxnRef");
            Payment payment = paymentRepository.findByVnpTxnRef(txnRef)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch: " + txnRef));

            long amountFromVnp = Long.parseLong(fields.get("vnp_Amount"));
            if (amountFromVnp != (long) (payment.getAmount() * 100)) {
                response.put("RspCode", "04");
                response.put("Message", "Sai tổng tiền");
                return response;
            }

            if (payment.getPaymentStatus() != Payment.PaymentStatus.PENDING) {
                response.put("RspCode", "02");
                response.put("Message", "Đã xử lý trước đó");
                return response;
            }

            String respCode = fields.get("vnp_ResponseCode");
            String transStatus = fields.get("vnp_TransactionStatus");
            boolean success = "00".equals(respCode) && "00".equals(transStatus);

            // 🔹 Cập nhật trạng thái Payment
            payment.setChecksumOk(true);
            payment.setVnpResponseCode(respCode);
            payment.setVnpTransactionStatus(transStatus);
            payment.setVnpTransactionNo(fields.get("vnp_TransactionNo"));
            payment.setVnpBankCode(fields.get("vnp_BankCode"));
            payment.setVnpPayDate(fields.get("vnp_PayDate"));
            payment.setMessage(VnPayUtils.getVnPayResponseMessage(respCode));
            payment.setPaymentStatus(success ? Payment.PaymentStatus.SUCCESS : Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);

            // 🔹 Cập nhật Invoice và logic phân nhánh
            Invoice invoice = payment.getInvoice();
            if (invoice != null) {
                if (success) {
                    invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
                    invoiceRepository.save(invoice);

                    if (invoice.getPlanToActivate() != null) {
                        subscriptionService.activateSubscription(invoice);
                    } else if (invoice.getBookings() != null && !invoice.getBookings().isEmpty()) {
                        for (Booking booking : invoice.getBookings()) {
                            booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
                            bookingRepository.save(booking);
                        }
                    } else if (invoice.getInvoiceType() == Invoice.InvoiceType.WALLET_TOPUP) {
                        User u = userRepository.findById(invoice.getUserId())
                                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + invoice.getUserId()));
                        double current = Optional.ofNullable(u.getWalletBalance()).orElse(0.0);
                        u.setWalletBalance(current + invoice.getTotalAmount());
                        userRepository.save(u);
                        log.info("💰 [WALLET] User={} được cộng {} vào ví. Tổng mới={}",
                                u.getUserId(), invoice.getTotalAmount(), u.getWalletBalance());
                    }

                } else {
                    invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);
                    invoiceRepository.save(invoice);
                    if (invoice.getBookings() != null) {
                        for (Booking booking : invoice.getBookings()) {
                            booking.setBookingStatus(Booking.BookingStatus.FAILED);
                            bookingRepository.save(booking);
                        }
                    }
                }
            }

            response.put("RspCode", "00");
            response.put("Message", VnPayUtils.getVnPayResponseMessage(respCode));
            return response;

        } catch (Exception e) {
            log.error("[IPN ERROR] {}", e.getMessage(), e);
            response.put("RspCode", "99");
            response.put("Message", "Lỗi xử lý IPN: " + e.getMessage());
            return response;
        }
    }
    /**
     * 3️⃣ Return URL (VNPAY → BE → FE)
     */
    @Transactional
    public Map<String, Object> handleVnPayReturn(Map<String, String> query) {
        log.info("[RETURN RECEIVED] {}", query);

        Map<String, Object> result = new HashMap<>();
        Map<String, String> fields = new HashMap<>(query);

        String secureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String dataToSign = VnPayUtils.buildDataToSign(fields);
        String signed = VnPayUtils.hmacSHA512(props.getHashSecret(), dataToSign);
        boolean checksumOk = signed.equalsIgnoreCase(secureHash);

        String respCode = query.getOrDefault("vnp_ResponseCode", "99");
        String txnRef = query.get("vnp_TxnRef");
        boolean success = checksumOk && "00".equals(respCode);

        log.info("🔍 [RETURN VALIDATION] txnRef={} | checksumOk={} | respCode={} | success={}",
                txnRef, checksumOk, respCode, success);

        // 🔹 Nếu người dùng HỦY giao dịch (respCode=24)
        if (checksumOk && "24".equals(respCode)) {
            paymentRepository.findByVnpTxnRef(txnRef).ifPresent(payment -> {
                if (payment.getPaymentStatus() == Payment.PaymentStatus.PENDING) {

                    // 🔧 Lưu thông tin VNPAY vào DB
                    updateVnpFields(payment, query);
                    payment.setChecksumOk(checksumOk);
                    payment.setMessage("Khách hàng hủy giao dịch.");
                    payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                    paymentRepository.save(payment);

                    Invoice invoice = payment.getInvoice();
                    if (invoice != null) {
                        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);
                        invoiceRepository.save(invoice);
                        if (invoice.getBookings() != null) {
                            for (Booking booking : invoice.getBookings()) {
                                booking.setBookingStatus(Booking.BookingStatus.FAILED);
                                bookingRepository.save(booking);
                            }
                        }
                    }
                    log.warn("⚠️ [RETURN CANCELLED] txnRef={} - User cancelled payment.", txnRef);
                }
            });
        }

        // 🔹 Tạo message trả về FE
        String message = VnPayUtils.getVnPayResponseMessage(respCode);
        if (message == null || message.isBlank()) {
            if ("24".equals(respCode)) {
                message = "Khách hàng hủy giao dịch.";
            } else if ("07".equals(respCode)) {
                message = "Giao dịch bị từ chối (do nghi ngờ gian lận hoặc lỗi hệ thống).";
            } else {
                message = "Giao dịch không thành công.";
            }
        }

        result.put("success", success);
        result.put("checksumOk", checksumOk);
        result.put("vnp_Amount", query.get("vnp_Amount"));
        result.put("vnp_TxnRef", txnRef);
        result.put("vnp_ResponseCode", respCode);
        result.put("message", message);

        // 🔹 Kiểm tra loại thanh toán (subscription / wallet topup)
        paymentRepository.findByVnpTxnRef(txnRef).ifPresent(payment -> {
            Invoice invoice = payment.getInvoice();
            if (invoice != null) {
                if (invoice.getInvoiceType() == Invoice.InvoiceType.WALLET_TOPUP) {
                    result.put("isWalletTopup", true);
                } else if (invoice.getPlanToActivate() != null) {
                    result.put("isSubscription", true);
                }
            }
        });

        log.info("📤 [RETURN RESULT] txnRef={} | success={} | message={} | walletTopup={} | subscription={}",
                txnRef, success, result.get("message"),
                result.get("isWalletTopup"), result.get("isSubscription"));

        return result;
    }

    private void updateVnpFields(Payment payment, Map<String, String> query) {
        payment.setVnpBankCode(query.get("vnp_BankCode"));
        payment.setVnpTransactionNo(query.get("vnp_TransactionNo"));
        payment.setVnpPayDate(query.get("vnp_PayDate"));
        payment.setVnpResponseCode(query.get("vnp_ResponseCode"));
        payment.setVnpTransactionStatus(query.get("vnp_TransactionStatus"));
    }

    @Transactional
    public Map<String, Object> refundBooking(String bookingId) {
        Booking booking = bookingRepository.findById(Long.valueOf(bookingId))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + bookingId));

        Invoice invoice = booking.getInvoice();
        if (invoice == null || invoice.getPayments() == null || invoice.getPayments().isEmpty()) {
            throw new IllegalStateException("Booking không thuộc hóa đơn nào hoặc chưa thanh toán.");
        }

        // 🔍 Tìm payment thành công mới nhất
        Payment payment = invoice.getPayments().stream()
                .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.SUCCESS)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy giao dịch thanh toán thành công."));

        Double bookingAmount = booking.getAmount();
        if (bookingAmount == null || bookingAmount <= 0) {
            throw new IllegalStateException("Booking không có giá trị thanh toán hợp lệ.");
        }

        // 🎯 Xác định loại hoàn tiền: toàn phần (02) hay một phần (03)
        String vnp_TransactionType;
        if (invoice.getBookings() != null && invoice.getBookings().size() > 1) {
            vnp_TransactionType = "03"; // partial refund
        } else {
            vnp_TransactionType = "02"; // full refund
        }

        // ========== BUILD REFUND REQUEST ==========
        String vnp_RequestId = "rf" + System.currentTimeMillis();
        String vnp_Version = props.getApiVersion();
        String vnp_Command = "refund";
        String vnp_TmnCode = props.getTmnCode();
        String vnp_TxnRef = payment.getVnpTxnRef();
        String vnp_TransactionNo = payment.getVnpTransactionNo();
        String vnp_TransactionDate = payment.getVnpPayDate(); // phải dạng yyyyMMddHHmmss

        if (vnp_TxnRef == null || vnp_TransactionNo == null || vnp_TransactionDate == null) {
            throw new IllegalStateException("Thiếu thông tin giao dịch gốc (TxnRef / TransactionNo / TransactionDate).");
        }

        // 🔧 Chuẩn hóa dữ liệu cho đúng format VNPay
        vnp_TransactionNo = vnp_TransactionNo.trim().replaceAll("[^0-9]", "");
        vnp_TransactionDate = vnp_TransactionDate.trim().replaceAll("[^0-9]", "");

        String vnp_CreateBy = "SystemRefundAPI";
        String vnp_CreateDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String vnp_IpAddr = "127.0.0.1";
        String vnp_Amount = String.valueOf(Math.round(bookingAmount)); // ép kiểu string ✅
        String vnp_OrderInfo = "Hoàn tiền cho booking #" + bookingId; // ⚠️ không encode, plain UTF-8

        // 🔐 Chuỗi hash chính xác theo tài liệu VNPay
        String data = String.join("|",
                vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode,
                vnp_TransactionType, vnp_TxnRef, vnp_Amount,
                vnp_TransactionNo, vnp_TransactionDate, vnp_CreateBy,
                vnp_CreateDate, vnp_IpAddr, vnp_OrderInfo
        );
        String vnp_SecureHash = VnPayUtils.hmacSHA512(props.getHashSecret(), data);

        // ✅ Body JSON gửi đi
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("vnp_RequestId", vnp_RequestId);
        body.put("vnp_Version", vnp_Version);
        body.put("vnp_Command", vnp_Command);
        body.put("vnp_TmnCode", vnp_TmnCode);
        body.put("vnp_TransactionType", vnp_TransactionType);
        body.put("vnp_TxnRef", vnp_TxnRef);
        body.put("vnp_Amount", vnp_Amount);
        body.put("vnp_TransactionNo", vnp_TransactionNo);
        body.put("vnp_TransactionDate", vnp_TransactionDate);
        body.put("vnp_CreateBy", vnp_CreateBy);
        body.put("vnp_CreateDate", vnp_CreateDate);
        body.put("vnp_IpAddr", vnp_IpAddr);
        body.put("vnp_OrderInfo", vnp_OrderInfo);
        body.put("vnp_SecureHash", vnp_SecureHash);

        body.entrySet().removeIf(e -> e.getValue() == null);

        log.info("🔹 Refund request (JSON): {}", body);

        // ========== CALL VNPay API (POST JSON) ==========
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = rest.postForEntity(props.getRefundUrl(), entity, String.class);
        String responseBody = response.getBody();

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("Không nhận được phản hồi từ VNPay (body rỗng).");
        }

        log.info("🔸 Refund HTTP Status: {}", response.getStatusCode());
        log.info("🔸 Refund raw response: {}", responseBody);

        // ========== PARSE RESPONSE ==========
        Map<String, Object> result;
        try {
            ObjectMapper mapper = new ObjectMapper();
            result = mapper.readValue(responseBody, Map.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Phản hồi VNPay không đúng định dạng JSON: " + responseBody);
        }

        String responseCode = (String) result.get("vnp_ResponseCode");
        String transactionStatus = (String) result.get("vnp_TransactionStatus");

        String refundMsg = VnPayUtils.getRefundResponseMessage(responseCode);
        String statusMsg = VnPayUtils.getVnPayTransactionStatusMessage(transactionStatus);

        log.info("🔸 Refund result: code={}, status={}, refundMsg={}, statusMsg={}",
                responseCode, transactionStatus, refundMsg, statusMsg);

        // ========== HANDLE RESULT ==========
        if ("00".equals(responseCode)) {
            payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
            payment.setMessage("Đã hoàn tiền VNPay cho booking #" + bookingId);
            paymentRepository.save(payment);

            booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
            booking.setCancellationReason("Đã hoàn tiền VNPay.");
            bookingRepository.save(booking);

            log.info("✅ Hoàn tiền thành công cho booking #{} - Payment REFUNDED: {}", bookingId, refundMsg);
        } else {
            throw new IllegalStateException("VNPay refund thất bại (" + responseCode + "): " + refundMsg);
        }

        // ========== TRẢ KẾT QUẢ CHO FE ==========
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("bookingId", bookingId);
        responseData.put("responseCode", responseCode);
        responseData.put("transactionStatus", transactionStatus);
        responseData.put("message", refundMsg);
        responseData.put("statusMessage", statusMsg);
        responseData.put("success", "00".equals(responseCode));

        return responseData;
    }

//    @Transactional
//    public String createVnPayPaymentUrlForSubscription(VnPayCreateSubscriptionPaymentRequest req, HttpServletRequest http) {
//        log.info("🟢 [CREATE] Bắt đầu tạo URL thanh toán gói cho user={} | planId={}", req.getUserId(), req.getPlanId());
//
//        User user = userRepository.findById(req.getUserId())
//                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + req.getUserId()));
//
//        SubscriptionPlan plan = subscriptionPlanRepository.findById(req.getPlanId().intValue())
//                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói cước: " + req.getPlanId()));
//
//        // 🔹 Lấy giá gói từ SystemPrice
//        Double amount = systemPriceRepository.findPriceByPriceType(plan.getPriceType())
//                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giá cho gói: " + plan.getPriceType()));
//
//        String ipAddr = VnPayUtils.getClientIp(http);
//        String txnRef = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
//        long amountTimes100 = Math.round(amount) * 100L;
//
//        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
//        ZonedDateTime now = ZonedDateTime.now(zone);
//        String vnpCreateDate = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
//        String vnpExpireDate = now.plusMinutes(props.getExpireMinutes())
//                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
//
//        Map<String, String> params = new LinkedHashMap<>();
//        params.put("vnp_Version", props.getApiVersion());
//        params.put("vnp_Command", props.getCommand());
//        params.put("vnp_TmnCode", props.getTmnCode());
//        params.put("vnp_Amount", String.valueOf(amountTimes100));
//        params.put("vnp_CurrCode", props.getCurrCode());
//        params.put("vnp_TxnRef", txnRef);
//        params.put("vnp_OrderInfo", "Thanh toán gói " + plan.getPlanName());
//        params.put("vnp_OrderType", "subscription");
//        params.put("vnp_Locale", (req.getLocale() == null || req.getLocale().isBlank()) ? "vn" : req.getLocale());
//        params.put("vnp_ReturnUrl", props.getReturnUrl());
//        params.put("vnp_IpAddr", ipAddr);
//        params.put("vnp_CreateDate", vnpCreateDate);
//        params.put("vnp_ExpireDate", vnpExpireDate);
//        if (req.getBankCode() != null && !req.getBankCode().isBlank()) {
//            params.put("vnp_BankCode", req.getBankCode());
//        }
//
//        // 🔹 Lưu Payment
//        Payment payment = Payment.builder()
//                .user(user)
//                .plan(plan)
//                .amount(amount)
//                .paymentMethod(Payment.PaymentMethod.QR_BANKING)
//                .paymentStatus(Payment.PaymentStatus.PENDING)
//                .gateway("VNPAY")
//                .vnpTxnRef(txnRef)
//                .message("Thanh toán gói: " + plan.getPlanName())
//                .createdAt(LocalDateTime.now(zone))
//                .build();
//        paymentRepository.save(payment);
//
//        // 🔹 Build URL
//        String payUrl = VnPayUtils.buildPaymentUrl(props.getPayUrl(), params, props.getHashSecret());
//        log.info("✅ [CREATE DONE] plan={} | txnRef={} | amount={} | URL={}", plan.getPlanName(), txnRef, amount, payUrl);
//
//        return payUrl;
//    }

    @Transactional
    public String createVnPayPaymentUrlForSubscriptionInvoice(VnPayCreatePaymentRequest req, HttpServletRequest http) {
        log.info("🟢 [CREATE SUBSCRIPTION] Bắt đầu tạo URL thanh toán gói cho invoiceId={}", req.getInvoiceId());

        // 1️⃣ Lấy Invoice
        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn #" + req.getInvoiceId()));

        if (invoice.getPlanToActivate() == null) {
            throw new IllegalStateException("Invoice #" + req.getInvoiceId() + " chưa gắn planToActivate (SubscriptionPlan).");
        }

        SubscriptionPlan plan = invoice.getPlanToActivate();

        // 2️⃣ Lấy giá từ SystemPrice
        Double amount = Optional.ofNullable(invoice.getTotalAmount())
                .filter(a -> a > 0)
                .orElseGet(() -> systemPriceRepository.findPriceByPriceType(plan.getPriceType())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giá cho gói " + plan.getPriceType()))
                );

        // 3️⃣ Kiểm tra đã thanh toán chưa
        boolean alreadyPaid = paymentRepository.existsByInvoiceAndPaymentStatus(invoice, Payment.PaymentStatus.SUCCESS);
        if (alreadyPaid)
            throw new IllegalStateException("Hóa đơn #" + invoice.getInvoiceId() + " đã được thanh toán.");

        // 4️⃣ Chuẩn bị thông tin VNPay
        String ipAddr = VnPayUtils.getClientIp(http);
        String txnRef = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        long amountTimes100 = Math.round(amount) * 100L;

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        String vnpCreateDate = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String vnpExpireDate = now.plusMinutes(props.getExpireMinutes())
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", props.getApiVersion());
        params.put("vnp_Command", props.getCommand());
        params.put("vnp_TmnCode", props.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountTimes100));
        params.put("vnp_CurrCode", props.getCurrCode());
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toán gói " + plan.getPlanName());
        params.put("vnp_OrderType", "subscription");
        params.put("vnp_Locale", (req.getLocale() == null || req.getLocale().isBlank()) ? "vn" : req.getLocale());
        params.put("vnp_ReturnUrl", props.getReturnUrl());
        params.put("vnp_IpAddr", ipAddr);
        params.put("vnp_CreateDate", vnpCreateDate);
        params.put("vnp_ExpireDate", vnpExpireDate);

        log.info("🔗 [VNPAY RETURN URL] {}", props.getReturnUrl());

        if (req.getBankCode() != null && !req.getBankCode().isBlank()) {
            params.put("vnp_BankCode", req.getBankCode());
        }

        // 5️⃣ Lưu Payment
        Payment payment2 = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .transactionType(Payment.TransactionType.PAYMENT)
                .gateway("VNPAY")
                .vnpTxnRef(txnRef)
                .message("Thanh toán gói: " + plan.getPlanName())
                .createdAt(LocalDateTime.now(zone))
                .build();

        paymentRepository.save(payment2);

        // 6️⃣ Build URL thanh toán
        String payUrl = VnPayUtils.buildPaymentUrl(props.getPayUrl(), params, props.getHashSecret());

        log.info("✅ [SUBSCRIPTION DONE] Invoice #{} | Plan={} | TxnRef={} | Amount={} | URL={}",
                invoice.getInvoiceId(), plan.getPlanName(), txnRef, amount, payUrl);

        return payUrl;
    }

    @Transactional
    public String createVnPayWalletTopup(WalletTopupRequest req, HttpServletRequest http, String userId) {
        log.info("💰 [CREATE WALLET TOPUP] userId={} | amount={}", userId, req.getAmount());

        if (req.getAmount() == null || req.getAmount() <= 0)
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + userId));

        Invoice invoice = new Invoice();
        invoice.setUserId(userId);
        invoice.setInvoiceType(Invoice.InvoiceType.WALLET_TOPUP);
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setTotalAmount(req.getAmount());
        invoiceRepository.save(invoice);

        String ipAddr = VnPayUtils.getClientIp(http);
        String txnRef = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        String vnpCreateDate = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String vnpExpireDate = now.plusMinutes(props.getExpireMinutes()).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        long amountTimes100 = Math.round(req.getAmount()) * 100L;

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", props.getApiVersion());
        params.put("vnp_Command", props.getCommand());
        params.put("vnp_TmnCode", props.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountTimes100));
        params.put("vnp_CurrCode", props.getCurrCode());
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Nạp tiền ví người dùng " + user.getFullName());
        params.put("vnp_OrderType", req.getOrderType());
        params.put("vnp_Locale", req.getLocale());
        params.put("vnp_ReturnUrl", props.getReturnUrl());
        params.put("vnp_IpAddr", ipAddr);
        params.put("vnp_CreateDate", vnpCreateDate);
        params.put("vnp_ExpireDate", vnpExpireDate);
        if (req.getBankCode() != null && !req.getBankCode().isBlank())
            params.put("vnp_BankCode", req.getBankCode());

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(req.getAmount())
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .transactionType(Payment.TransactionType.PAYMENT)
                .gateway("VNPAY")
                .vnpTxnRef(txnRef)
                .createdAt(LocalDateTime.now(zone))
                .message("Nạp tiền ví người dùng " + user.getFullName())
                .build();

        paymentRepository.save(payment);

        String payUrl = VnPayUtils.buildPaymentUrl(props.getPayUrl(), params, props.getHashSecret());
        log.info("✅ [WALLET TOPUP CREATED] invoiceId={} | txnRef={} | amount={} | url={}",
                invoice.getInvoiceId(), txnRef, req.getAmount(), payUrl);

        return payUrl;
    }



}
