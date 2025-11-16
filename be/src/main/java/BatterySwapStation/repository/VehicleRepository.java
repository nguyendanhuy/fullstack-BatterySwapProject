package BatterySwapStation.repository;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    List<Vehicle> findByUserIsNullAndIsActiveTrue();



    @Query("SELECT v FROM Vehicle v WHERE v.user IS NULL AND v.isActive = false")
    List<Vehicle> findUnassignedVehicles();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.user.userId = :userId")
    int countByUserId(@Param("userId") String userId);

    // ----- Admin fast projection -----
    interface VehicleAdminProjection {
        Integer getVehicleId();
        String getVIN();
        String getLicensePlate();
        String getOwnerName();
        String getColor();
        String getVehicleType();
        String getBatteryType();
        Integer getBatteryCount();
        Boolean getIsActive();
        String getUserId();
    }

    @Query("SELECT v.vehicleId as vehicleId, v.VIN as VIN, v.licensePlate as licensePlate, v.ownerName as ownerName, v.color as color, v.vehicleType as vehicleType, v.batteryType as batteryType, v.batteryCount as batteryCount, v.isActive as isActive, v.user.userId as userId FROM Vehicle v")
    Page<VehicleAdminProjection> findAllProjected(Pageable pageable);

}