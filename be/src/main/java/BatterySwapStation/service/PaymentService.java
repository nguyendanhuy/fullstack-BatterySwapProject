package BatterySwapStation.service;

import BatterySwapStation.config.VnPayProperties;
import BatterySwapStation.dto.VnPayCreatePaymentRequest;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.PaymentRepository;
import BatterySwapStation.utils.VnPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VnPayProperties props;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;

    /**
     * 1️⃣ Tạo URL thanh toán (FE gọi)
     * 👉 Chỉ tạo Payment với trạng thái PENDING, chưa update DB khác.
     */
    @Transactional
    public String createVnPayPaymentUrlByInvoice(VnPayCreatePaymentRequest req, HttpServletRequest http) {
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

        // 💾 Lưu Payment trạng thái chờ
        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(Payment.PaymentMethod.QR_BANKING)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .gateway("VNPAY")
                .vnpTxnRef(txnRef)
                .createdAt(LocalDateTime.now(zone))
                .build();

        paymentRepository.save(payment);
        return VnPayUtils.buildPaymentUrl(props.getPayUrl(), params, props.getHashSecret());
    }

    /**
     * 2️⃣ IPN callback (VNPAY → BE)
     * 👉 Xử lý chính thức: cập nhật DB, trạng thái hóa đơn & booking.
     */
    @Transactional
    public Map<String, String> handleVnPayIpn(Map<String, String> query) {
        Map<String, String> response = new HashMap<>();
        try {
            Map<String, String> fields = new HashMap<>(query);
            String secureHash = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            String dataToSign = VnPayUtils.buildDataToSign(fields);
            String signed = VnPayUtils.hmacSHA512(props.getHashSecret(), dataToSign);

            if (!signed.equalsIgnoreCase(secureHash)) {
                response.put("RspCode", "97");
                response.put("Message", "Checksum không hợp lệ");
                return response;
            }

            String txnRef = fields.get("vnp_TxnRef");
            Payment payment = paymentRepository.findByVnpTxnRef(txnRef)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));

            long amountFromVnp = Long.parseLong(fields.get("vnp_Amount"));
            if (amountFromVnp != (long) (payment.getAmount() * 100)) {
                response.put("RspCode", "04");
                response.put("Message", "Tổng tiền không hợp lệ");
                return response;
            }

            if (payment.getPaymentStatus() != Payment.PaymentStatus.PENDING) {
                response.put("RspCode", "02");
                response.put("Message", "Đã xử lý rồi");
                return response;
            }

            String respCode = fields.get("vnp_ResponseCode");
            String transStatus = fields.get("vnp_TransactionStatus");
            boolean success = "00".equals(respCode) && "00".equals(transStatus);

            payment.setChecksumOk(true);
            payment.setVnpResponseCode(respCode);
            payment.setVnpTransactionStatus(transStatus);
            payment.setVnpTransactionNo(fields.get("vnp_TransactionNo"));
            payment.setVnpBankCode(fields.get("vnp_BankCode"));
            payment.setVnpPayDate(fields.get("vnp_PayDate"));
            payment.setPaymentStatus(success ? Payment.PaymentStatus.SUCCESS : Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);

            // Cập nhật Invoice + Booking
            Invoice invoice = payment.getInvoice();
            if (invoice != null && invoice.getBookings() != null) {
                if (success) {
                    invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
                    invoiceRepository.save(invoice);
                    for (Booking booking : invoice.getBookings()) {
                        booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
                        bookingRepository.save(booking);
                    }
                } else {
                    invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);
                    invoiceRepository.save(invoice);
                    for (Booking booking : invoice.getBookings()) {
                        booking.setBookingStatus(Booking.BookingStatus.FAILED);
                        bookingRepository.save(booking);
                    }
                }
            }

            response.put("RspCode", "00");
            response.put("Message", "Xác minh thành công");
            return response;
        } catch (Exception e) {
            response.put("RspCode", "99");
            response.put("Message", "Lỗi xử lý IPN");
            return response;
        }
    }

    /**
     * 3️⃣ Return URL (BE → FE redirect)
     * 👉 Chỉ kiểm checksum & báo FE, không cập nhật DB.
     */
    public Map<String, Object> handleVnPayReturn(Map<String, String> query) {
        Map<String, Object> result = new HashMap<>();
        Map<String, String> fields = new HashMap<>(query);

        String secureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String dataToSign = VnPayUtils.buildDataToSign(fields);
        String signed = VnPayUtils.hmacSHA512(props.getHashSecret(), dataToSign);
        boolean checksumOk = signed.equalsIgnoreCase(secureHash);
        boolean success = checksumOk && "00".equals(query.get("vnp_ResponseCode"));

        result.put("success", success);
        result.put("checksumOk", checksumOk);
        result.put("vnp_Amount", query.get("vnp_Amount"));
        result.put("vnp_TxnRef", query.get("vnp_TxnRef"));
        result.put("message", success ? "Giao dịch thành công" : "Giao dịch thất bại");

        return result;
    }

}

