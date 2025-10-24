package BatterySwapStation.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditIssueDTO {
    private String batteryId;      // mã pin liên quan (có thể null)
    private Integer stationId;     // trạm liên quan (có thể null)
    private String dockName;       // tên dock (có thể null)
    private Integer slotNumber;    // số slot (có thể null)

    private String issueType;      // BATTERY_NO_SLOT, STATE_MISMATCH, STATION_MISMATCH, SLOT_UNSYNC_BATTERY, ORPHAN_SLOT, ...
    private String description;    // mô tả ngắn gọn lỗi
    private String note;           // gợi ý xử lý (có thể null)
    private String detectedAt;     // thời điểm phát hiện (ISO string)
}
