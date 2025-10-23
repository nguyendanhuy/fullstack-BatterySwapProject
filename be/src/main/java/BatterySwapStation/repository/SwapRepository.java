package BatterySwapStation.repository;

import BatterySwapStation.entity.Swap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {

    Optional<Swap> findTopByBooking_BookingIdOrderBySwapIdDesc(Long bookingId);


}
