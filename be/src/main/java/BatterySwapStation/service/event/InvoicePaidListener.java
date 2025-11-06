package BatterySwapStation.service.event;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.service.EmailService;
import BatterySwapStation.service.InvoicePaidEvent;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.entity.User;
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

        StringBuilder bookingTable = new StringBuilder();
        if (invoice.getBookings() != null && !invoice.getBookings().isEmpty()) {
            bookingTable.append("""
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
                bookingTable.append(String.format("""
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
            bookingTable.append("</table>");
        }

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
                bookingTable.toString(),
                invoice.getInvoiceId()
        );
    }
}
