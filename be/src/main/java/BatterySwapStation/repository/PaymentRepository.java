package BatterySwapStation.repository;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByVnpTxnRef(String vnpTxnRef);

    boolean existsByInvoiceAndPaymentStatus(Invoice invoice, Payment.PaymentStatus status);

    // Cũ: có thể trả về 1 bản ghi; vẫn giữ để tương thích chỗ khác nếu có
    Payment findByInvoice(Invoice invoice);

    // Mới: trả về tất cả payment theo invoice (derived)
    List<Payment> findAllByInvoice(Invoice invoice);

    // Mới (an toàn): trả về tất cả payment theo invoice (JPQL tường minh)
    @Query("SELECT p FROM Payment p WHERE p.invoice = :invoice")
    List<Payment> findAllByInvoiceJPQL(@Param("invoice") Invoice invoice);
}
