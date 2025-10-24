package BatterySwapStation.repository;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Swap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {

    Optional<Swap> findTopByBooking_BookingIdOrderBySwapIdDesc(Long bookingId);
    // Lấy tất cả swap theo stationId (qua Booking -> Station)
    @Query("""
           select s
           from Swap s
           where s.booking.station.stationId = :stationId
           order by s.completedTime desc
           """)
    List<Swap> findAllByStationId(@Param("stationId") Integer stationId);

    /**
     * ✅ [SỬA LỖI]
     * Tìm bản ghi Swap MỚI NHẤT (dựa theo thời gian hoàn thành)
     * cho một Booking cụ thể.
     */
    Optional<Swap> findFirstByBookingOrderByCompletedTimeDesc(Booking booking);
}
