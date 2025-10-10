package BatterySwapStation.repository;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Tìm tất cả booking của user
    List<Booking> findByUser(User user);

    // Tìm booking của user theo status
    List<Booking> findByUserAndBookingStatus(User user, Booking.BookingStatus status);

    // Tìm booking theo ID và User (để đảm bảo user chỉ thao tác với booking của mình)
    Optional<Booking> findByBookingIdAndUser(Long bookingId, User user);

    // Kiểm tra xem user đã có booking PENDING hoặc CONFIRMED chưa
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user " +
            "AND (b.bookingStatus = 'PENDING' OR b.bookingStatus = 'CONFIRMED') " +
            "AND b.bookingDate >= :currentDate")
    boolean existsActiveBookingForUser(@Param("user") User user, @Param("currentDate") LocalDate currentDate);

    // Tìm booking theo station và ngày
    List<Booking> findByStationAndBookingDate(Station station, LocalDate bookingDate);

    // Kiểm tra time slot đã được đặt chưa
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.station = :station " +
            "AND b.bookingDate = :date AND b.timeSlot = :timeSlot " +
            "AND (b.bookingStatus = 'PENDING' OR b.bookingStatus = 'CONFIRMED')")
    boolean existsBookingAtTimeSlot(@Param("station") Station station,
                                   @Param("date") LocalDate date,
                                   @Param("timeSlot") LocalTime timeSlot);

    // Tìm tất cả booking của station
    List<Booking> findByStation(Station station);

    // Tìm booking theo status
    List<Booking> findByBookingStatus(Booking.BookingStatus status);
}

