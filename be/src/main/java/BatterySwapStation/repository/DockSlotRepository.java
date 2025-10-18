package BatterySwapStation.repository;

import BatterySwapStation.entity.DockSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DockSlotRepository extends JpaRepository<DockSlot, Integer> {

    // Tìm slot đang chứa pin cụ thể
    @Query("SELECT ds FROM DockSlot ds WHERE ds.battery.batteryId = :batteryId")
    DockSlot findByBatteryId(@Param("batteryId") String batteryId);

    // Tìm slot trống trong dock bất kỳ tại station
    @Query("""
        SELECT ds FROM DockSlot ds
        WHERE ds.isActive = true
          AND ds.battery IS NULL
          AND ds.dock.station.stationId = :stationId
        """)
    DockSlot findFirstEmptySlotAtStation(@Param("stationId") Integer stationId);
}
