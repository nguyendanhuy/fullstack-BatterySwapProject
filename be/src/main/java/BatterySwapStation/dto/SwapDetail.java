package BatterySwapStation.dto;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Swap;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapDetail {

    private Long swapId;
    private Long bookingId;
    private Integer stationId;
    private String stationName;

    // 👤 Driver
    private String driverId;
    private String driverName;
    private String driverPhone;

    // 👷 Staff
    private String staffId;
    private String staffName;
    private String staffPhone;

    // 🔋 Battery
    private String batteryOutId;
    private String batteryOutType;
    private String batteryInId;
    private String batteryInType;

    // 🔌 Dock Slots
    private String dockOutSlot;
    private String dockInSlot;

    // ⚙️ Status
    private String status;
    private LocalDateTime completedTime;
    private String description;

    // ✅ Constructor dành riêng cho JPQL query
    public SwapDetail(
            Long swapId,
            Long bookingId,
            Integer stationId,
            String stationName,
            String driverId,
            String driverName,
            String driverPhone,
            String staffId,
            String staffName,
            String staffPhone,
            String batteryOutId,
            Battery.BatteryType batteryOutType,
            String batteryInId,
            Battery.BatteryType batteryInType,
            String dockOutSlot,
            String dockInSlot,
            Swap.SwapStatus status,
            LocalDateTime completedTime,
            String description
    ) {
        this.swapId = swapId;
        this.bookingId = bookingId;
        this.stationId = stationId;
        this.stationName = stationName;
        this.driverId = driverId;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.staffId = staffId;
        this.staffName = staffName;
        this.staffPhone = staffPhone;
        this.batteryOutId = batteryOutId;
        this.batteryOutType = (batteryOutType != null ? batteryOutType.name() : null);
        this.batteryInId = batteryInId;
        this.batteryInType = (batteryInType != null ? batteryInType.name() : null);
        this.dockOutSlot = dockOutSlot;
        this.dockInSlot = dockInSlot;
        this.status = (status != null ? status.name() : null);
        this.completedTime = completedTime;
        this.description = description;
    }
}
