package BatterySwapStation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import BatterySwapStation.entity.StaffAssign;

@Repository
public interface StaffAssignRepository extends JpaRepository<StaffAssign, Integer> {


    
}
