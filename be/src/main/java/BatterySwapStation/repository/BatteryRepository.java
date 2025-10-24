package BatterySwapStation.repository;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatteryRepository extends JpaRepository<Battery, String> {

    // Tìm pin theo station và trạng thái active
    List<Battery> findByStationIdAndIsActiveTrue(Integer stationId);

    // Tìm pin theo trạng thái
    List<Battery> findByBatteryStatus(Battery.BatteryStatus status);

    // Tìm pin khả dụng tại station
    @Query("SELECT b FROM Battery b WHERE b.stationId = :stationId AND b.isActive = true AND " +
           "(b.batteryStatus = 'AVAILABLE' OR b.batteryStatus = 'CHARGING') AND " +
           "b.stateOfHealth > 70.0")
    List<Battery> findAvailableBatteriesAtStation(@Param("stationId") Integer stationId);

    // Tìm pin theo loại
    List<Battery> findByBatteryType(Battery.BatteryType batteryType);

    // Đếm số pin khả dụng tại station
    @Query("SELECT COUNT(b) FROM Battery b WHERE b.stationId = :stationId AND b.isActive = true AND " +
           "(b.batteryStatus = 'AVAILABLE' OR b.batteryStatus = 'CHARGING') AND " +
           "b.stateOfHealth > 70.0")
    Long countAvailableBatteriesAtStation(@Param("stationId") Integer stationId);


    Optional<Battery> findByVehicle(Vehicle vehicle);
}
