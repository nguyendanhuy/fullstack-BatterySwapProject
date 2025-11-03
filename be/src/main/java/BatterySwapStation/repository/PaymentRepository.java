package BatterySwapStation.repository;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByVnpTxnRef(String vnpTxnRef);

    boolean existsByInvoiceAndPaymentStatus(Invoice invoice, Payment.PaymentStatus status);

    List<Payment> findAllByInvoice(Invoice invoice);

    Optional<Payment> findTopByInvoiceAndPaymentMethodAndPaymentStatus(
            Invoice invoice,
            Payment.PaymentMethod method,
            Payment.PaymentStatus status
    );

}
