package BatterySwapStation.repository;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DockSlotRepository extends JpaRepository<DockSlot, Integer> {

    // Tìm slot đang chứa 1 battery cụ thể
    Optional<DockSlot> findByBattery_BatteryId(String batteryId);

    // Tìm 1 slot trống (isActive=true & battery=null) trong station
    Optional<DockSlot> findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(Integer stationId);

    // Lấy 1 slot đang "giữ pin đầy có sẵn" trong trạm để giao cho user (pinOut)
    java.util.Optional<DockSlot> findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
            Integer stationId,
            DockSlot.SlotStatus slotStatus,
            Battery.BatteryStatus batteryStatus
    );
    long countByDock_Station_StationIdAndBattery_BatteryStatus(Integer stationId, Battery.BatteryStatus status);
    Optional<DockSlot> findFirstByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
            Integer stationId,
            Battery.BatteryType batteryType,
            Battery.BatteryStatus batteryStatus,
            DockSlot.SlotStatus slotStatus
    );

}
