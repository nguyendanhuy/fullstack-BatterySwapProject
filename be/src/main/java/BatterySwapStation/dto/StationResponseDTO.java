package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationResponseDTO {
    private int stationId;
    private String stationName;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean isActive;

    // Thống kê pin theo trạng thái (FULL, CHARGING, EMPTY, DAMAGED)
    private Map<String, Long> batterySummary;

    // Thống kê pin theo loại (LITHIUM_ION, LEAD_ACID, ...)
    private Map<String, Long> batteryTypes;
}
