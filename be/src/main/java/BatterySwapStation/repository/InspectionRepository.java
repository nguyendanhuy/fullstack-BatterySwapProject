package BatterySwapStation.repository;

import BatterySwapStation.entity.BatteryInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // (Import List)

@Repository
public interface InspectionRepository extends JpaRepository<BatteryInspection, Long> {

    /**
     * [THÊM MỚI]
     * Hàm này để Staff lấy danh sách inspection (API GET /all),
     * sắp xếp theo thời gian kiểm tra, MỚI NHẤT lên đầu.
     */
    List<BatteryInspection> findAllByOrderByInspectionTimeDesc();

}