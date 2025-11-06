package BatterySwapStation.repository;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("SELECT i FROM Invoice i WHERE i.invoiceId = :id")
    Optional<Invoice> findByIdWithoutBookings(@Param("id") Long id);

    List<Invoice> findByInvoiceStatus(Invoice.InvoiceStatus status);

    List<Invoice> findByUserId(String userId);

    /**
     * Tìm các invoice PENDING được tạo trước thời gian timeout
     */
    @Query("SELECT i FROM Invoice i WHERE i.invoiceStatus = :status AND i.createdDate < :timeoutDate")
    List<Invoice> findPendingInvoicesOlderThan(
            @Param("status") Invoice.InvoiceStatus status,
            @Param("timeoutDate") LocalDateTime timeoutDate
    );

    /**
     * ✅ [GIỮ LẠI HÀM NÀY]
     * Kiểm tra xem User đã có Hóa đơn GIA HẠN (Pending)
     * cho một Gói cước cụ thể hay chưa.
     */
    boolean existsByUserIdAndPlanToActivateAndInvoiceStatus(
            String userId,
            SubscriptionPlan planToActivate,
            Invoice.InvoiceStatus invoiceStatus
    );

    @Query("""
    SELECT i
    FROM Invoice i
    JOIN i.bookings b
    WHERE b.bookingId = :bookingId
""")
    Optional<Invoice> findByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Lấy danh sách invoice VÀ các payment liên quan (để tránh LazyInitException)
     */
    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.payments WHERE i.userId = :userId ORDER BY i.createdDate DESC")
    List<Invoice> findByUserIdWithPayments(@Param("userId") String userId);

    /**
     * Lấy 1 invoice VÀ các payment liên quan (để tránh LazyInitException)
     */
    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.payments WHERE i.invoiceId = :invoiceId")
    Optional<Invoice> findByIdWithPayments(@Param("invoiceId") Long invoiceId);


    @Query("""
    SELECT b.station.stationId AS stationId,
           DATE(i.createdDate) AS date,
           SUM(i.totalAmount) AS totalRevenue
    FROM Invoice i
    JOIN Booking b ON b.invoice.invoiceId = i.invoiceId
    WHERE DATE(i.createdDate) BETWEEN :start AND :end
    GROUP BY b.station.stationId, DATE(i.createdDate)
    ORDER BY b.station.stationId ASC, DATE(i.createdDate) ASC
""")
    List<Map<String, Object>> fetchDailyRevenueByAllStations(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );


    @Query("""
    SELECT DATE(i.createdDate) AS date,
           SUM(i.totalAmount) AS totalRevenue
    FROM Invoice i
    JOIN i.bookings b
    WHERE b.station.stationId = :stationId
      AND DATE(i.createdDate) BETWEEN :start AND :end
    GROUP BY DATE(i.createdDate)
    ORDER BY DATE(i.createdDate)
""")
    List<Map<String, Object>> fetchDailyRevenueByStation(
            @Param("stationId") Integer stationId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );


    @Query("SELECT i FROM Invoice i WHERE i.userId = :userId " +
            "AND i.invoiceType = 'SUBSCRIPTION' " +
            "AND i.invoiceStatus = 'PAID' " +
            "ORDER BY i.createdDate DESC")
    List<Invoice> findLatestPaidSubscriptionInvoices(@Param("userId") String userId);

    @Query("""
SELECT DISTINCT i FROM Invoice i
LEFT JOIN FETCH i.bookings b
LEFT JOIN FETCH b.station
LEFT JOIN FETCH b.vehicle
LEFT JOIN FETCH i.planToActivate
WHERE i.userId = :userId
ORDER BY i.createdDate DESC
""")
    List<Invoice> findByUserIdWithFullDetails(@Param("userId") String userId);


    @Query("""
SELECT DISTINCT i FROM Invoice i
LEFT JOIN FETCH i.bookings b
LEFT JOIN FETCH b.station
LEFT JOIN FETCH b.vehicle
LEFT JOIN FETCH i.payments
LEFT JOIN FETCH i.planToActivate
WHERE i.invoiceId = :invoiceId
""")
    Optional<Invoice> findByIdWithFullDetails(@Param("invoiceId") Long invoiceId);


}