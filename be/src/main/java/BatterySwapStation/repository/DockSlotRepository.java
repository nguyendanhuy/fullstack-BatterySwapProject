package BatterySwapStation.repository;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DockSlotRepository extends JpaRepository<DockSlot, Integer> {

    // 🔹 1️⃣ Tìm slot đang chứa 1 battery cụ thể
    Optional<DockSlot> findByBattery_BatteryId(String batteryId);

    // 🔹 2️⃣ Tìm slot TRỐNG trong station (battery=null, active=true)
    Optional<DockSlot> findFirstByDock_Station_StationIdAndBatteryIsNullAndIsActiveTrue(Integer stationId);

    // 🔹 3️⃣ Lấy slot đang "giữ pin đầy có sẵn" để giao cho user (pinOut)
    Optional<DockSlot> findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
            Integer stationId,
            DockSlot.SlotStatus slotStatus,
            Battery.BatteryStatus batteryStatus
    );

    // 🔹 4️⃣ Lấy slot đầu tiên có loại pin cụ thể (model matching)
    Optional<DockSlot> findFirstByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
            Integer stationId,
            Battery.BatteryType batteryType,
            Battery.BatteryStatus batteryStatus,
            DockSlot.SlotStatus slotStatus
    );

    // 🔹 5️⃣ Lấy TẤT CẢ các slot có pin đầy khả dụng (cho handleSingleSwap)
    List<DockSlot> findAllByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
            Integer stationId,
            Battery.BatteryType batteryType,
            Battery.BatteryStatus batteryStatus,
            DockSlot.SlotStatus slotStatus
    );

    // 🔹 6️⃣ Đếm số pin có trạng thái AVAILABLE tại 1 trạm
    long countByDock_Station_StationIdAndBattery_BatteryStatus(Integer stationId, Battery.BatteryStatus status);
}
