package BatterySwapStation.repository;

import BatterySwapStation.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Integer> {

    // Tổng hợp pin đầy / sạc / tổng cho từng trạm
    @Query("""
        SELECT s.stationId,
               s.stationName,
               s.address,
               s.latitude,
               s.longitude,
               s.isActive,
               SUM(CASE WHEN b.batteryStatus = 'AVAILABLE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN b.batteryStatus = 'CHARGING' THEN 1 ELSE 0 END),
               SUM(CASE WHEN b.batteryStatus IN ('AVAILABLE','CHARGING') THEN 1 ELSE 0 END)
        FROM Station s
        LEFT JOIN s.docks d ON d.isActive = TRUE
        LEFT JOIN d.dockSlots ds ON ds.isActive = TRUE
        LEFT JOIN ds.battery b
        WHERE s.isActive = TRUE
        GROUP BY s.stationId, s.stationName, s.address, s.latitude, s.longitude, s.isActive
        """)
    List<Object[]> getStationSummary();

    //  Đếm pin theo loại (per batteryType)
    @Query("""
        SELECT s.stationId, b.batteryType,
               SUM(CASE WHEN b.batteryStatus = 'AVAILABLE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN b.batteryStatus = 'CHARGING'  THEN 1 ELSE 0 END)
        FROM Station s
        LEFT JOIN s.docks d ON d.isActive = TRUE
        LEFT JOIN d.dockSlots ds ON ds.isActive = TRUE
        LEFT JOIN ds.battery b
        WHERE s.isActive = TRUE
        GROUP BY s.stationId, b.batteryType
        """)
    List<Object[]> getStationBatteryTypes();


}
