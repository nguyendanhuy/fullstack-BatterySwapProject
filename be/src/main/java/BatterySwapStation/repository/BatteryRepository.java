package BatterySwapStation.repository;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Vehicle;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatteryRepository extends JpaRepository<Battery, String> {

    // Tìm pin theo station và trạng thái active
   // List<Battery> findByStationIdAndIsActiveTrue(Integer stationId);

    // Tìm pin theo trạng thái
    List<Battery> findByBatteryStatus(Battery.BatteryStatus status);

    // Tìm pin khả dụng tại station
    @Query("SELECT b FROM Battery b WHERE b.stationId = :stationId AND b.isActive = true AND " +
            "(b.batteryStatus = 'AVAILABLE' OR b.batteryStatus = 'CHARGING') AND " +
            "b.stateOfHealth > 70.0")
    //List<Battery> findAvailableBatteriesAtStation(@Param("stationId") Integer stationId);

    // Tìm pin theo loại
    List<Battery> findByBatteryType(Battery.BatteryType batteryType);

    // Đếm số pin khả dụng tại station
    @Query("SELECT COUNT(b) FROM Battery b WHERE b.stationId = :stationId AND b.isActive = true AND " +
            "(b.batteryStatus = 'AVAILABLE' OR b.batteryStatus = 'CHARGING') AND " +
            "b.stateOfHealth > 70.0")
    //Long countAvailableBatteriesAtStation(@Param("stationId") Integer stationId);


    Optional<Battery> findByVehicle(Vehicle vehicle);

    @EntityGraph(attributePaths = {"dockSlot", "dockSlot.dock", "dockSlot.dock.station"})
    List<Battery> findAll(); // ✅ chỉ override findAll() mặc định

    // 🔹 Lấy tất cả Battery trong 1 station cụ thể (cũng fetch full quan hệ)
    @EntityGraph(attributePaths = {"dockSlot", "dockSlot.dock", "dockSlot.dock.station"})
    List<Battery> findByStationId(Integer stationId);

    @Query(value = """
    SELECT b.BatteryId, b.BatteryType, b.BatteryStatus,
           b.StateOfHealth, b.CurrentCapacity, b.StationId
    FROM Battery b
    LEFT JOIN DockSlot ds ON ds.BatteryId = b.BatteryId
    WHERE b.StationId = :stationId
      AND b.IsActive = TRUE
      AND ds.BatteryId IS NULL
""", nativeQuery = true)
    List<Object[]> findLooseBatteriesFastByStation(@Param("stationId") Integer stationId);





    @Query("""
                SELECT b
                FROM Battery b
                JOIN b.dockSlot ds
                JOIN ds.dock d
                WHERE d.station.stationId = :stationId
                  AND b.batteryStatus = 'WAITING'
                  AND ds.slotStatus = 'OCCUPIED'
                  AND ds.isActive = true
            """)
    List<Battery> findWaitingBatteriesByStation(@Param("stationId") Integer stationId);


    @Query("""
                SELECT b.dockSlot.dock.station.stationId, COUNT(b)
                FROM Battery b
                GROUP BY b.dockSlot.dock.station.stationId
            """)
    List<Object[]> countBatteriesForAllStations();

    @Query("""
                SELECT b.batteryType
                FROM Battery b
                WHERE b.stationId = :stationId
                GROUP BY b.batteryType
                ORDER BY COUNT(b.batteryType) DESC
                LIMIT 1
            """)
    Optional<String> findDominantBatteryTypeAtStation(@Param("stationId") Integer stationId);

    @Query("SELECT b FROM Battery b WHERE b.stationId IS NOT NULL AND b.dockSlot IS NULL")
    List<Battery> findLooseBatteriesWithStation();

    // 🔹 Native query: lấy pin có stationId nhưng không nằm trong bất kỳ DockSlot nào
    @Query(value = """
    SELECT b.BatteryId, b.BatteryType, b.BatteryStatus,
           b.StateOfHealth, b.CurrentCapacity, b.StationId
    FROM Battery b
    WHERE b.StationId IS NOT NULL
      AND b.IsActive = TRUE
      AND b.BatteryId NOT IN (
          SELECT ds.BatteryId FROM DockSlot ds WHERE ds.BatteryId IS NOT NULL
      )
""", nativeQuery = true)
    List<Object[]> findLooseBatteriesWithStationFast();
    @Query("""
    SELECT b 
    FROM Battery b 
    WHERE b.stationId IS NULL 
      AND b.dockSlot IS NULL 
      AND b.isActive = true
      AND b.batteryType = :type
    ORDER BY FUNCTION('RANDOM')
""")
    List<Battery> findRandomUnassignedBatteriesByType(@Param("type") Battery.BatteryType type, Pageable pageable);


}
