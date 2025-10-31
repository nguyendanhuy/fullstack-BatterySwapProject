package BatterySwapStation.dto;

import lombok.Data; // (Giả sử bạn dùng Lombok)
import java.time.LocalDateTime;

@Data
public class InspectionResponse { // (Tên DTO của bạn có thể khác)

    private Long id;
    private LocalDateTime inspectionTime;
    private Double stateOfHealth;
    private String physicalNotes;
    private boolean damaged;
    private String batteryId;
}