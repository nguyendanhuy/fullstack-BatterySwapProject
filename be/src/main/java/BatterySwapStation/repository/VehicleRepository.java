package BatterySwapStation.repository;

import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    Optional<Vehicle> findByVIN(String vin);

    List<Vehicle> findByUserAndIsActiveTrue(User user);

    // Method mới để lấy vehicle cùng với thông tin owner
    @Query("SELECT v FROM Vehicle v JOIN FETCH v.user u WHERE v.user = :user AND v.isActive = true")
    List<Vehicle> findByUserAndIsActiveTrueWithOwner(@Param("user") User user);

    Optional<Vehicle> findByVehicleIdAndUser_UserId(int vehicleId, String userId);


    // ✅ Thêm methods cho CSV Import
    boolean existsByVIN(String VIN);

    boolean existsByLicensePlate(String licensePlate);

    @Query("SELECT v FROM Vehicle v WHERE v.VIN IN :vins")
    List<Vehicle> findAllByVINs(@Param("vins") List<String> vins);
}