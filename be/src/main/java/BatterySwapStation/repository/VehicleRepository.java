package BatterySwapStation.repository;

import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    Optional<Vehicle> findByVIN(String vin);

    List<Vehicle> findByUserAndIsActiveTrue(User user);

    Optional<Vehicle> findByVehicleIdAndUser_UserId(int vehicleId, String userId);
}