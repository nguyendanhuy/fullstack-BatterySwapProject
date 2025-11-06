package BatterySwapStation.dto;

import lombok.Data;
import java.time.LocalDateTime;


@Data
public class TicketResponse {
    private Long id;
    private Long bookingId;
    private String title;
    private String description;
    private String status;
    private LocalDateTime resolvedAt;
    private String resolutionMethod;
    private String resolutionDescription;
    private LocalDateTime createdAt;
    private String createdByStaffName;
    private String reason;


    // ➕ Add cho trường hợp phạt cần thanh toán
    private Long invoiceId;
    private String paymentUrl;
    private String penaltyLevel;
    private String paymentChannel;
}
