package BatterySwapStation.repository;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
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
     * ✅ [THÊM MỚI] Dùng cho Scheduler (Phase 5)
     * Kiểm tra xem User đã có Hóa đơn GIA HẠN (Pending)
     * cho một Gói cước cụ thể hay chưa.
     */
    boolean existsByUserIdAndPlanToActivateAndInvoiceStatus(
            String userId,
            SubscriptionPlan planToActivate,
            Invoice.InvoiceStatus invoiceStatus
    );
}
