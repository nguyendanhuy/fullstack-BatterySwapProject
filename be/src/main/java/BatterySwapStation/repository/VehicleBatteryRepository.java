package BatterySwapStation.repository;

import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.entity.VehicleBattery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleBatteryRepository extends JpaRepository<VehicleBattery, Long> {
    List<VehicleBattery> findByVehicle(Vehicle vehicle);
}

