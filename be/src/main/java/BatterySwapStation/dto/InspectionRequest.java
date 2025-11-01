package BatterySwapStation.dto;

import lombok.Data;

@Data
public class InspectionRequest {

    // ✅ [SỬA] Chìa khóa chính là pin Staff đang cầm
    private String batteryInId;

    // (Chúng ta vẫn cần bookingId để liên kết)
    private Long bookingId;

    private Double stateOfHealth;
    private String physicalNotes;
    private String status;

    private String staffId;
}