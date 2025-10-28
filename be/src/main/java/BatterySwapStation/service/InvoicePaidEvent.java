package BatterySwapStation.service; // (Hoặc package .service.event của bạn)

import BatterySwapStation.entity.Invoice;
import org.springframework.context.ApplicationEvent;

/**
 * [SỬA LỖI VÒNG LẶP]
 * Đây là sự kiện được bắn ra KHI một Invoice được set thành PAID.
 */
public class InvoicePaidEvent extends ApplicationEvent {

    private final Invoice invoice;

    public InvoicePaidEvent(Object source, Invoice invoice) {
        super(source);
        this.invoice = invoice;
    }

    public Invoice getInvoice() {
        return invoice;
    }
}