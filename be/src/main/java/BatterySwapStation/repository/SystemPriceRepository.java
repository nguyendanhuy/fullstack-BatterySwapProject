package BatterySwapStation.repository;

import BatterySwapStation.entity.SystemPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemPriceRepository extends JpaRepository<SystemPrice, Long> {

    /**
     * [THAY THẾ] Tìm một mức giá bằng Enum PriceType
     * (Thay thế cho logic 'findCurrentSystemPrice' cũ)
     */
    Optional<SystemPrice> findByPriceType(SystemPrice.PriceType priceType);

    /**
     * [MỚI] Lấy giá trị (kiểu Double) trực tiếp bằng Enum PriceType
     * Đây là hàm mà Service của bạn sẽ sử dụng.
     */
    @Query("SELECT sp.price FROM SystemPrice sp WHERE sp.priceType = :priceType")
    Optional<Double> findPriceByPriceType(@Param("priceType") SystemPrice.PriceType priceType);

}