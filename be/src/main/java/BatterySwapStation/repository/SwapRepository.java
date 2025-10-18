package BatterySwapStation.repository;

import BatterySwapStation.entity.Swap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {
    List<Swap> findByBookingBookingId(Long bookingId);
}
