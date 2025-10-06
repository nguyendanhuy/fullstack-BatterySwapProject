package BatterySwapStation.service;

import BatterySwapStation.dto.PaymentRequest;
import BatterySwapStation.dto.PaymentResponse;
import BatterySwapStation.entity.VehiclePurchaseInvoice;
import BatterySwapStation.repository.VehiclePurchaseInvoiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final VehiclePurchaseInvoiceRepository invoiceRepository;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        VehiclePurchaseInvoice invoice = invoiceRepository.findByInvoiceNumber(request.getInvoiceNumber())
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found with number: " + request.getInvoiceNumber()));

        if (invoice.isVerified()) {
            return new PaymentResponse(false, "Invoice already paid/verified.", invoice.getInvoiceNumber());
        }

        // Cập nhật thông tin người mua (nếu cần)
        invoice.setBuyerName(request.getBuyerName());
        invoice.setBuyerEmail(request.getBuyerEmail());
        invoice.setBuyerPhone(request.getBuyerPhone());
        invoice.setVerified(true);
        invoiceRepository.save(invoice);

        return new PaymentResponse(true, "Payment successful. Invoice verified.", invoice.getInvoiceNumber());
    }
}

