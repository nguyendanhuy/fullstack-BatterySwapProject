package BatterySwapStation.repository;

import BatterySwapStation.entity.VehiclePurchaseInvoice;
import lombok.Data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VehiclePurchaseInvoiceRepository extends JpaRepository<VehiclePurchaseInvoice, Long> {
    Optional<VehiclePurchaseInvoice> findByInvoiceNumber(String invoiceNumber);
    Optional<VehiclePurchaseInvoice> findByVehicle_VIN(String vin);

    @Data
    public class PaymentRequest {
        private String invoiceNumber;
        private String buyerName;
        private String buyerEmail;
        private String buyerPhone;
        // Có thể bổ sung thêm các trường paymentMethod, amount nếu cần
    }
}