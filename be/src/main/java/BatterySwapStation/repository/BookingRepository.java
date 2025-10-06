package BatterySwapStation.repository;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    // Tìm tất cả booking của user
    List<Booking> findByUser(User user);

    // Tìm booking của user theo status
    List<Booking> findByUserAndStatus(User user, Booking.BookingStatus status);

    // Tìm booking theo ID và User (để đảm bảo user chỉ thao tác với booking của mình)
    Optional<Booking> findByBookingIdAndUser(int bookingId, User user);

    // Kiểm tra xem user đã có booking PENDING hoặc CONFIRMED chưa
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user " +
            "AND (b.status = 'PENDING' OR b.status = 'CONFIRMED') " +
            "AND b.scheduledTime > :currentTime")
    boolean existsActiveBookingForUser(@Param("user") User user,
                                       @Param("currentTime") LocalDateTime currentTime);

    // Tìm các booking của station trong khoảng thời gian
    @Query("SELECT b FROM Booking b WHERE b.station = :station " +
            "AND b.scheduledTime BETWEEN :startTime AND :endTime " +
            "AND (b.status = 'PENDING' OR b.status = 'CONFIRMED')")
    List<Booking> findStationBookingsInTimeRange(@Param("station") Station station,
                                                 @Param("startTime") LocalDateTime startTime,
                                                 @Param("endTime") LocalDateTime endTime);

    // Tìm booking sắp tới của user
    @Query("SELECT b FROM Booking b WHERE b.user = :user " +
            "AND b.scheduledTime > :currentTime " +
            "AND (b.status = 'PENDING' OR b.status = 'CONFIRMED') " +
            "ORDER BY b.scheduledTime ASC")
    List<Booking> findUpcomingBookingsByUser(@Param("user") User user,
                                             @Param("currentTime") LocalDateTime currentTime);
}