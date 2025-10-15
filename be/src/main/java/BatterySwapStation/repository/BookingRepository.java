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
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Tìm tất cả booking của user
    List<Booking> findByUser(User user);

    // Tìm booking của user theo status
    List<Booking> findByUserAndStatus(User user, Booking.BookingStatus status);

    // Tìm booking theo ID và User (để đảm bảo user chỉ thao tác với booking của mình)
    Optional<Booking> findByBookingIdAndUser(Long bookingId, User user);

    // Kiểm tra xem user đã có booking PENDING hoặc CONFIRMED chưa
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user " +
            "AND (b.status = 'PENDING' OR b.status = 'CONFIRMED') " +
            "AND b.scheduledTime >= :currentDateTime")
    boolean existsActiveBookingForUser(@Param("user") User user, @Param("currentDateTime") LocalDateTime currentDateTime);

    // Tìm booking theo station và ngày (sử dụng range thay vì DATE function)
    @Query("SELECT b FROM Booking b WHERE b.station = :station " +
            "AND b.scheduledTime >= :startOfDay AND b.scheduledTime < :endOfDay")
    List<Booking> findByStationAndBookingDate(@Param("station") Station station,
                                            @Param("startOfDay") LocalDateTime startOfDay,
                                            @Param("endOfDay") LocalDateTime endOfDay);

    // Kiểm tra time slot đã được đặt chưa (so sánh trực tiếp với scheduledTime)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.station = :station " +
            "AND b.scheduledTime = :scheduledDateTime " +
            "AND (b.status = 'PENDING' OR b.status = 'CONFIRMED')")
    boolean existsBookingAtTimeSlot(@Param("station") Station station,
                                   @Param("scheduledDateTime") LocalDateTime scheduledDateTime);

    // Tìm tất cả booking của station
    List<Booking> findByStation(Station station);

    // Tìm booking theo status
    List<Booking> findByStatus(Booking.BookingStatus status);
}
