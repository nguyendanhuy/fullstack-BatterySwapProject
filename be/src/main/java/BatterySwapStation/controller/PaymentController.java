package BatterySwapStation.controller;

import BatterySwapStation.dto.VnPayCreatePaymentRequest;
import BatterySwapStation.dto.VnPayCreatePaymentResponse;
import BatterySwapStation.dto.PaymentResponse;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment;
import BatterySwapStation.repository.PaymentRepository;
import BatterySwapStation.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

/**
 * Controller xử lý thanh toán qua VNPAY (theo Invoice)
 */
@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
@PreAuthorize("permitAll()")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    /**
     * 🔹 API duy nhất: FE truyền invoiceId, BE tự tính totalAmount → tạo link thanh toán VNPAY
     */
    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VnPayCreatePaymentResponse> createPayment(
            @RequestBody VnPayCreatePaymentRequest request,
            HttpServletRequest httpServletRequest) {

        String paymentUrl = paymentService.createVnPayPaymentUrlByInvoice(request, httpServletRequest);
        return ResponseEntity.ok(new VnPayCreatePaymentResponse(paymentUrl));
    }

    /** 🔹 API: IPN callback từ VNPAY (VNPAY → BE) */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleVnPayIpn(
            @RequestParam Map<String, String> queryParams) {
        Map<String, String> response = paymentService.handleVnPayIpn(queryParams);
        return ResponseEntity.ok(response);
    }

    /** 🔹 API: FE kiểm tra trạng thái thanh toán thật từ DB */
    @GetMapping("/status/{txnRef}")
    public ResponseEntity<PaymentResponse> getPaymentStatus(@PathVariable String txnRef) {

        Optional<Payment> paymentOpt = paymentRepository.findByVnpTxnRef(txnRef);
        if (paymentOpt.isEmpty()) {
            return ResponseEntity.ok(PaymentResponse.builder()
                    .txnRef(txnRef)
                    .paymentStatus("NOT_FOUND")
                    .message("Không tìm thấy giao dịch")
                    .build());
        }

        Payment payment = paymentOpt.get();
        Invoice invoice = payment.getInvoice();

        return ResponseEntity.ok(PaymentResponse.builder()
                .txnRef(txnRef)
                .paymentStatus(payment.getPaymentStatus().toString())
                .invoiceStatus(invoice != null ? invoice.getInvoiceStatus().toString() : null)
                .invoiceId(invoice != null ? invoice.getInvoiceId() : null)
                .amount(payment.getAmount())
                .gateway(payment.getGateway())
                .vnpTransactionNo(payment.getVnpTransactionNo())
                .vnpResponseCode(payment.getVnpResponseCode())
                .vnpBankCode(payment.getVnpBankCode())
                .vnpPayDate(payment.getVnpPayDate())
                .createdAt(payment.getCreatedAt())
                .message(payment.getMessage())
                .build());
    }

    /** 🔹 API: ReturnURL redirect từ VNPAY (hiển thị kết quả cho người dùng) */
    @GetMapping("/return")
    public void handleVnPayReturn(
            @RequestParam Map<String, String> queryParams,
            HttpServletResponse response) throws IOException {

        Map<String, Object> result = paymentService.handleVnPayReturn(queryParams);

        String status = (Boolean.TRUE.equals(result.get("success"))) ? "success" : "failed";
        String amount = (String) result.getOrDefault("vnp_Amount", "0");
        String message = (String) result.getOrDefault("message", "");
        String txnRef = (String) result.getOrDefault("vnp_TxnRef", "");

        // FE
        String redirectUrl = String.format(
                "http://localhost:5173/driver/payment?status=%s&amount=%s&message=%s&vnp_TxnRef=%s",
                status,
                amount,
                URLEncoder.encode(message, StandardCharsets.UTF_8),
                URLEncoder.encode(txnRef, StandardCharsets.UTF_8)
        );

        response.sendRedirect(redirectUrl);
    }
    @PostMapping("/refund-booking/{bookingId}")
    public ResponseEntity<Map<String, Object>> refundBooking(
            @PathVariable String bookingId) {

        Map<String, Object> result = paymentService.refundBooking(bookingId);
        return ResponseEntity.ok(result);
    }
}
