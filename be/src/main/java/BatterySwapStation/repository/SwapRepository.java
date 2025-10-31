package BatterySwapStation.repository;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Swap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {

    Optional<Swap> findTopByBooking_BookingIdOrderBySwapIdDesc(Long bookingId);

    // Lấy tất cả swap theo stationId (qua Booking -> Station)
    @Query("""
        SELECT s
        FROM Swap s
        WHERE s.booking.station.stationId = :stationId
        ORDER BY s.completedTime DESC
    """)
    List<Swap> findAllByStationId(@Param("stationId") Integer stationId);

    Optional<Swap> findFirstByBookingOrderByCompletedTimeDesc(Booking booking);

    // ✅ Lấy swap theo station và ngày
    @Query("""
        SELECT s
        FROM Swap s
        WHERE s.booking.station.stationId = :stationId
          AND FUNCTION('DATE', s.completedTime) = :date
    """)
    List<Swap> findByStationAndDate(
            @Param("stationId") Integer stationId,
            @Param("date") LocalDate date
    );

    // ✅ Daily swap ALL stations
    @Query("""
        SELECT b.station.stationId AS stationId,
               FUNCTION('DATE', s.completedTime) AS date,
               COUNT(s) AS swapCount
        FROM Swap s
        JOIN s.booking b
        WHERE FUNCTION('DATE', s.completedTime) BETWEEN :start AND :end
        GROUP BY b.station.stationId, FUNCTION('DATE', s.completedTime)
        ORDER BY b.station.stationId, FUNCTION('DATE', s.completedTime)
    """)
    List<Map<String, Object>> fetchDailySwapByAllStations(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    // ✅ Daily swap for ONE station
    @Query("""
        SELECT FUNCTION('DATE', s.completedTime) AS date,
               COUNT(s) AS swapCount
        FROM Swap s
        JOIN s.booking b
        WHERE b.station.stationId = :stationId
          AND FUNCTION('DATE', s.completedTime) BETWEEN :start AND :end
        GROUP BY FUNCTION('DATE', s.completedTime)
        ORDER BY FUNCTION('DATE', s.completedTime)
    """)
    List<Map<String, Object>> fetchDailySwapByStation(
            @Param("stationId") Integer stationId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("SELECT COUNT(s) FROM Swap s WHERE s.batteryOutId = :batteryId OR s.batteryInId = :batteryId")
    long countSwapsByBattery(@Param("batteryId") String batteryId);


}
