package BatterySwapStation.repository;

import BatterySwapStation.dto.SwapDetail;
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

    // ✅ Lấy tất cả swap của một trạm trong khoảng thời gian với eager fetch
    @Query("""
        SELECT s
        FROM Swap s
        JOIN FETCH s.booking b
        JOIN FETCH b.user
        JOIN FETCH b.vehicle
        WHERE b.station.stationId = :stationId
          AND FUNCTION('DATE', s.completedTime) BETWEEN :start AND :end
        ORDER BY s.completedTime DESC
    """)
    List<Swap> findAllByStationIdAndDateRange(
            @Param("stationId") Integer stationId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("""
SELECT s.booking.bookingId
FROM Swap s
WHERE s.batteryInId = :batteryId
ORDER BY s.completedTime DESC
""")
    List<Integer> findLatestBookingIdByBattery(@Param("batteryId") String batteryId);

    @Query(value = "SELECT COUNT(*) FROM swap WHERE userid = :userId", nativeQuery = true)
    int countSwapsByUser(String userId);


    @Query("""
SELECT new BatterySwapStation.dto.SwapDetail(
    s.swapId,
    b.bookingId,
    st.stationId,
    st.stationName,
    u.userId,
    u.fullName,
    u.phone,
    sf.userId,
    sf.fullName,
    sf.phone,
    batOut.batteryId,
    batOut.batteryType,
    batIn.batteryId,
    batIn.batteryType,
    s.dockOutSlot,
    s.dockInSlot,
    s.status,
    s.completedTime,
    s.description
)
FROM Swap s
JOIN s.booking b
JOIN b.station st
JOIN b.user u
LEFT JOIN User sf ON sf.userId = s.staffUserId
LEFT JOIN Battery batOut ON batOut.batteryId = s.batteryOutId
LEFT JOIN Battery batIn ON batIn.batteryId = s.batteryInId
WHERE st.stationId = :stationId
ORDER BY s.completedTime DESC
""")
    List<SwapDetail> findDetailedSwapsByStation(@Param("stationId") Integer stationId);

}
