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
        dto.setId(invoice.getInvoiceId()); // Use getInvoiceId() instead of getId()
        dto.setCreatedDate(invoice.getCreatedDate());
        dto.setTotalAmount(invoice.getTotalAmount());

        List<BookingInfoDTO> bookingDTOs = invoice.getBookings().stream().map(booking -> {
            BookingInfoDTO bDto = new BookingInfoDTO();
            bDto.setBookingId(booking.getBookingId());

            // Convert scheduledTime to bookingDate and timeSlot
            if (booking.getScheduledTime() != null) {
                bDto.setBookingDate(booking.getScheduledTime().toLocalDate());
                bDto.setTimeSlot(booking.getScheduledTime().toLocalTime());
            }

            return bDto;
        }).collect(Collectors.toList());

        dto.setBookings(bookingDTOs);
        return dto;
    }
}
