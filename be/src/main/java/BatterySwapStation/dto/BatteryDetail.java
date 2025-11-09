package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BatteryDetail {
    // Vị trí
    private Integer stationId;
    private String stationName;
    private Integer dockId;
    private String dockName;
    private Integer dockSlotId;
    private Integer slotNumber;

    // Battery info
    private String batteryId;
    private String status;
    private String batteryType;
    private Double currentCapacity;
    private Double stateOfHealth;
    private Integer cycleCount;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private Boolean isActive;

    // Extra info
    private long swapCount;
}

