package BatterySwapStation.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketResponse {
    private Long id;
    private Long inspectionId;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String createdByStaffName;
    private String reason;
}