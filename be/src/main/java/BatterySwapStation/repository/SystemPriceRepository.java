package BatterySwapStation.repository;

import BatterySwapStation.entity.SystemPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemPriceRepository extends JpaRepository<SystemPrice, Long> {

    /**
     * Lấy giá hiện tại của hệ thống (chỉ có 1 record duy nhất)
     */
    @Query("SELECT sp FROM SystemPrice sp ORDER BY sp.id DESC")
    Optional<SystemPrice> findCurrentSystemPrice();

    /**
     * Kiểm tra có tồn tại SystemPrice nào chưa
     */
    boolean existsBy();

    /**
     * Lấy SystemPrice đầu tiên (fallback)
     */
    Optional<SystemPrice> findFirstByOrderByIdAsc();
}
