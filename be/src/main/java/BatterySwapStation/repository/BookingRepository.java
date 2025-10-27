package BatterySwapStation.repository;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
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

    // Tìm booking của user theo status (sử dụng enum)
    List<Booking> findByUserAndBookingStatus(User user, Booking.BookingStatus status);

    // Tìm booking theo ID và User (để đảm bảo user chỉ thao tác với booking của mình)
    Optional<Booking> findByBookingIdAndUser(Long bookingId, User user);

    // Tìm tất cả booking theo invoice
    List<Booking> findAllByInvoice(Invoice invoice);

    // Kiểm tra xem user đã có booking PENDINGPAYMENT hoặc PENDINGSWAPPING chưa (theo ngày)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user " +
            "AND b.bookingDate = :bookingDate " +
            "AND (b.bookingStatus = 'PENDINGPAYMENT' OR b.bookingStatus = 'PENDINGSWAPPING') " +
            "AND b.bookingStatus != 'CANCELLED'")
    boolean existsActiveBookingForUserByDate(@Param("user") User user, @Param("bookingDate") LocalDate bookingDate);

    // Kiểm tra booking đang hoạt động trong khoảng thời gian
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user " +
            "AND b.bookingDate BETWEEN :startDate AND :endDate " +
            "AND (b.bookingStatus = 'PENDINGPAYMENT' OR b.bookingStatus = 'PENDINGSWAPPING')")
    boolean existsActiveBookingForUserInDateRange(@Param("user") User user,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    // Tìm booking theo station và ngày
    @Query("SELECT b FROM Booking b WHERE b.station = :station " +
            "AND b.bookingDate = :bookingDate")
    List<Booking> findByStationAndBookingDate(@Param("station") Station station,
                                              @Param("bookingDate") LocalDate bookingDate);

    // Kiểm tra time slot đã được đặt chưa
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.station = :station " +
            "AND b.bookingDate = :bookingDate " +
            "AND b.timeSlot = :timeSlot " +
            "AND (b.bookingStatus = 'PENDINGPAYMENT' OR b.bookingStatus = 'PENDINGSWAPPING') " +
            "AND b.bookingStatus != 'CANCELLED'")
    boolean existsBookingAtTimeSlot(@Param("station") Station station,
                                    @Param("bookingDate") LocalDate bookingDate,
                                    @Param("timeSlot") LocalTime timeSlot);

    // Tìm tất cả booking của station
    List<Booking> findByStation(Station station);

    // Tìm booking theo status (sử dụng enum)
    List<Booking> findByBookingStatus(Booking.BookingStatus status);

    // Tìm tất cả booking của vehicle cụ thể
    List<Booking> findByVehicle(BatterySwapStation.entity.Vehicle vehicle);

    // Tìm booking theo vehicle và user
    List<Booking> findByVehicleAndUser(BatterySwapStation.entity.Vehicle vehicle, User user);

    // ========== CÁC METHOD MỚI - KIỂM TRA BOOKING CHƯA HOÀN THÀNH ==========

    /**
     * Kiểm tra xe có booking chưa hoàn thành không
     * Chỉ cho phép đặt booking mới nếu tất cả booking cũ đều COMPLETED, CANCELLED hoặc FAILED
     */
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.vehicle.vehicleId = :vehicleId " +
            "AND b.bookingStatus NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')")
    boolean hasIncompleteBookingForVehicle(@Param("vehicleId") Integer vehicleId);

    /**
     * Lấy danh sách booking chưa hoàn thành của xe (để hiển thị thông tin chi tiết)
     */
    @Query("SELECT b FROM Booking b WHERE b.vehicle.vehicleId = :vehicleId " +
            "AND b.bookingStatus NOT IN ('COMPLETED', 'CANCELLED', 'FAILED') " +
            "ORDER BY b.bookingDate DESC, b.timeSlot DESC")
    List<Booking> findIncompleteBookingsByVehicle(@Param("vehicleId") Integer vehicleId);

    // ========================================================================

    // Kiểm tra vehicle có booking đang hoạt động không (method cũ - giữ lại để tương thích)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.vehicle = :vehicle " +
            "AND (b.bookingStatus = 'PENDINGPAYMENT' OR b.bookingStatus = 'PENDINGSWAPPING') " +
            "AND b.bookingDate >= :currentDate")
    boolean existsActiveBookingForVehicle(@Param("vehicle") BatterySwapStation.entity.Vehicle vehicle,
                                          @Param("currentDate") LocalDate currentDate);

    // --- Added derived query methods required by BookingService ---
    // Tìm booking của user theo ngày
    List<Booking> findByUserAndBookingDate(User user, LocalDate bookingDate);

    // Tìm booking theo trạng thái và ngày
    List<Booking> findByBookingStatusAndBookingDate(Booking.BookingStatus bookingStatus, LocalDate bookingDate);

    // Tìm booking của user theo trạng thái và ngày
    List<Booking> findByUserAndBookingStatusAndBookingDate(User user, Booking.BookingStatus bookingStatus, LocalDate bookingDate);

    // Kiểm tra trùng lặp booking theo user, vehicle, station, ngày và khung giờ
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user = :user AND b.vehicle = :vehicle AND b.station = :station AND b.bookingDate = :bookingDate AND b.timeSlot = :timeSlot AND (b.bookingStatus = 'PENDINGPAYMENT' OR b.bookingStatus = 'PENDINGSWAPPING')")
    boolean existsDuplicateBooking(@Param("user") User user,
                                   @Param("vehicle") BatterySwapStation.entity.Vehicle vehicle,
                                   @Param("station") Station station,
                                   @Param("bookingDate") LocalDate bookingDate,
                                   @Param("timeSlot") LocalTime timeSlot);


    /**
     * Tính tổng số pin (batteryCount) đã được đặt và CHƯA HOÀN THÀNH
     * tại một trạm vào một ngày và khung giờ cụ thể.
     */
    @Query("SELECT SUM(b.batteryCount) FROM Booking b " +
            "WHERE b.station = :station " +
            "AND b.bookingDate = :date " +
            "AND b.timeSlot = :timeSlot " +
            "AND b.bookingStatus NOT IN (BatterySwapStation.entity.Booking.BookingStatus.COMPLETED, " +
            "BatterySwapStation.entity.Booking.BookingStatus.CANCELLED, " +
            "BatterySwapStation.entity.Booking.BookingStatus.FAILED)")
    Integer getBookedBatteryCountAtTimeSlot(@Param("station") Station station,
                                            @Param("date") LocalDate date,
                                            @Param("timeSlot") LocalTime timeSlot);

}