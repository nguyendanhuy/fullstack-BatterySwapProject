package BatterySwapStation.service.event;

import BatterySwapStation.entity.*;
import BatterySwapStation.service.EmailService;
import BatterySwapStation.service.InvoicePaidEvent;
import BatterySwapStation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class InvoicePaidListener {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @EventListener
    public void handleInvoicePaid(InvoicePaidEvent event) {
        Invoice invoice = event.getInvoice();
        log.info("📩 [EMAIL EVENT] Invoice #{} vừa được thanh toán thành công", invoice.getInvoiceId());

        try {
            User user = userRepository.findById(invoice.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + invoice.getUserId()));

            String toEmail = user.getEmail();
            String subject = "🎉 Thanh toán thành công - Hóa đơn #" + invoice.getInvoiceId();

            // ===== HTML TEMPLATE =====
            String html = buildInvoiceEmailHtml(user, invoice);

            emailService.sendEmail(toEmail, subject, html);
            log.info("✅ Đã gửi email xác nhận thanh toán tới {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Lỗi khi gửi email cho Invoice #{}: {}", invoice.getInvoiceId(), e.getMessage(), e);
        }
    }

    private String buildInvoiceEmailHtml(User user, Invoice invoice) {
        String formattedDate = invoice.getCreatedDate() != null
                ? invoice.getCreatedDate().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                : "—";

        String detailSection = switch (invoice.getInvoiceType()) {
            case BOOKING -> buildBookingTable(invoice);
            case SUBSCRIPTION -> buildSubscriptionInfo(invoice);
            case WALLET_TOPUP -> buildWalletTopupInfo(invoice);
            case PENALTY -> buildPenaltyInfo(invoice);
            case REFUND -> buildRefundInfo(invoice);
        };

        return """
            <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
                <div style="text-align:center;">
                    <h2 style="color:#007bff;">🚗 Thanh toán thành công!</h2>
                    <p>Xin chào <b>%s</b>,</p>
                    <p>Bạn đã thanh toán thành công hóa đơn <b>#%d</b> của hệ thống <b>Battery Swap Station</b>.</p>
                    <hr style="border:none;border-top:1px solid #eee;">
                </div>

                <p><b>Thông tin hóa đơn:</b></p>
                <ul>
                    <li><b>Mã hóa đơn:</b> #%d</li>
                    <li><b>Ngày tạo:</b> %s</li>
                    <li><b>Loại hóa đơn:</b> %s</li>
                    <li><b>Tổng tiền:</b> <span style="color:#28a745;">%,.0f VNĐ</span></li>
                </ul>

                %s

                <hr style="margin-top:30px;">
                <p style="font-size:12px;color:gray;text-align:center;">
                    © 2025 Battery Swap Station Team<br>
                    Email này được gửi tự động, vui lòng không trả lời.
                </p>
            </div>
        """.formatted(
                user.getFullName(),
                invoice.getInvoiceId(),
                invoice.getInvoiceId(),
                formattedDate,
                invoice.getInvoiceType(),
                invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0,
                detailSection
        );
    }



    // 🔹 Chi tiết cho hóa đơn BOOKING
    private String buildBookingTable(Invoice invoice) {
        if (invoice.getBookings() == null || invoice.getBookings().isEmpty()) {
            return "<p>Không có thông tin đặt pin trong hóa đơn này.</p>";
        }
        StringBuilder sb = new StringBuilder("""
            <table style="width:100%;border-collapse:collapse;margin-top:10px;">
                <tr style="background:#007bff;color:white;">
                    <th style="padding:8px;">#</th>
                    <th style="padding:8px;">Ngày đặt</th>
                    <th style="padding:8px;">Khung giờ</th>
                    <th style="padding:8px;">Trạm</th>
                    <th style="padding:8px;">Số tiền (VNĐ)</th>
                </tr>
        """);
        int idx = 1;
        for (Booking b : invoice.getBookings()) {
            sb.append(String.format("""
                <tr style="border-bottom:1px solid #ddd;text-align:center;">
                    <td style="padding:8px;">%d</td>
                    <td style="padding:8px;">%s</td>
                    <td style="padding:8px;">%s</td>
                    <td style="padding:8px;">%s</td>
                    <td style="padding:8px;">%,.0f</td>
                </tr>
            """, idx++,
                    b.getBookingDate() != null ? b.getBookingDate() : "—",
                    b.getTimeSlot() != null ? b.getTimeSlot() : "—",
                    (b.getStation() != null ? b.getStation().getStationName() : "—"),
                    b.getAmount() != null ? b.getAmount() : 0.0
            ));
        }
        sb.append("</table>");
        return sb.toString();
    }

    // 🔹 Chi tiết cho hóa đơn SUBSCRIPTION
    private String buildSubscriptionInfo(Invoice invoice) {
        SubscriptionPlan plan = invoice.getPlanToActivate();
        if (plan == null) return "<p>Không có thông tin gói cước.</p>";
        return """
            <div style="margin-top:15px;">
                <p><b>Thông tin gói cước:</b></p>
                <ul>
                    <li>Tên gói: <b>%s</b></li>
                    <li>Thời hạn: %d ngày</li>
                    <li>Giới hạn lượt đổi pin: %d lượt</li>
                    <li>Mô tả: %s</li>
                </ul>
            </div>
        """.formatted(
                plan.getPlanName(),
                plan.getDurationInDays(),
                plan.getSwapLimit(),
                plan.getDescription()
        );
    }

    // 🔹 Chi tiết cho hóa đơn WALLET_TOPUP
    private String buildWalletTopupInfo(Invoice invoice) {
        return """
            <p style="margin-top:10px;">
                Bạn đã nạp thành công số tiền <b style="color:#28a745;">%,.0f VNĐ</b> vào ví điện tử của mình.
            </p>
        """.formatted(invoice.getTotalAmount());
    }

    // 🔹 Chi tiết cho hóa đơn PENALTY
    private String buildPenaltyInfo(Invoice invoice) {
        return """
            <p style="margin-top:10px;color:#dc3545;">
                Bạn đã thanh toán thành công khoản <b>tiền phạt</b> liên quan đến vi phạm trong quá trình đổi pin.
            </p>
            <p>Xin cảm ơn bạn đã hoàn tất nghĩa vụ thanh toán đúng hạn.</p>
        """;
    }

    // 🔹 Chi tiết cho hóa đơn REFUND
    private String buildRefundInfo(Invoice invoice) {
        if (invoice.getPayments() == null || invoice.getPayments().isEmpty()) {
            return "<p>Không có thông tin hoàn tiền.</p>";
        }

        // Lấy payment có TransactionType = REFUND
        Payment refundPayment = invoice.getPayments().stream()
                .filter(p -> p.getTransactionType() == Payment.TransactionType.REFUND)
                .findFirst()
                .orElse(null);

        if (refundPayment == null) {
            return "<p>Không tìm thấy giao dịch hoàn tiền.</p>";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"margin-top:15px;\">");
        sb.append("<p><b>🔄 Thông tin hoàn tiền:</b></p>");
        sb.append("<ul>");
        sb.append(String.format("<li><b>Số tiền hoàn:</b> <span style=\"color:#28a745;\">%,.0f VNĐ</span></li>",
                Math.abs(refundPayment.getAmount())));
        sb.append(String.format("<li><b>Phương thức hoàn tiền:</b> %s</li>",
                refundPayment.getPaymentChannel() != null ? refundPayment.getPaymentChannel() : "—"));
        sb.append(String.format("<li><b>Trạng thái:</b> %s</li>", refundPayment.getPaymentStatus()));

        // Thông tin VNPay nếu có
        if (refundPayment.getVnpTransactionNo() != null) {
            sb.append(String.format("<li><b>Mã giao dịch VNPay:</b> %s</li>", refundPayment.getVnpTransactionNo()));
        }
        if (refundPayment.getVnpTxnRef() != null) {
            sb.append(String.format("<li><b>Mã tham chiếu:</b> %s</li>", refundPayment.getVnpTxnRef()));
        }

        // Thông tin phạt nếu có
        if (refundPayment.getPenaltyAmount() != null && refundPayment.getPenaltyAmount() > 0) {
            sb.append(String.format("<li><b>Số tiền phạt trừ:</b> <span style=\"color:#dc3545;\">%,.0f VNĐ</span></li>",
                    refundPayment.getPenaltyAmount()));
            if (refundPayment.getPenaltyLevel() != null) {
                sb.append(String.format("<li><b>Mức phạt:</b> %s</li>", refundPayment.getPenaltyLevel()));
            }
        }

        // Lý do hoàn tiền
        if (refundPayment.getMessage() != null) {
            sb.append(String.format("<li><b>Lý do:</b> %s</li>", refundPayment.getMessage()));
        }

        sb.append("</ul>");
        sb.append("</div>");

        return sb.toString();
    }
}
