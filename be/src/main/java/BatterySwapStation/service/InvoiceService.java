package BatterySwapStation.service;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.dto.InvoiceResponseDTO;
import BatterySwapStation.dto.BookingInfoDTO;
import BatterySwapStation.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {
    @Autowired
    private InvoiceRepository invoiceRepository;

    public InvoiceResponseDTO getInvoiceDetail(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getInvoiceId());
        dto.setCreatedDate(invoice.getCreatedDate());
        dto.setTotalAmount(invoice.getTotalAmount());

        List<BookingInfoDTO> bookingDTOs = invoice.getBookings().stream().map(booking -> {
            BookingInfoDTO bDto = new BookingInfoDTO();
            bDto.setBookingId(booking.getBookingId());

            // Sử dụng bookingDate và timeSlot trực tiếp
            bDto.setBookingDate(booking.getBookingDate());
            bDto.setTimeSlot(booking.getTimeSlot());

            return bDto;
        }).collect(Collectors.toList());

        dto.setBookings(bookingDTOs);
        return dto;
    }

    public Invoice createInvoice(Invoice invoice) {
        invoice.setInvoiceId(null); // Đảm bảo sử dụng sequence tự động
        return invoiceRepository.save(invoice);
    }

    public Invoice updateInvoice(Long id, Invoice invoice) {
        Invoice existing = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
        existing.setCreatedDate(invoice.getCreatedDate());
        existing.setTotalAmount(invoice.getTotalAmount());
        // Nếu có bookings thì xử lý thêm
        return invoiceRepository.save(existing);
    }

    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }
}
