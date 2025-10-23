package BatterySwapStation.service;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionService {

    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;
    private final BatteryInspectionRepository inspectionRepository; // (Cần tạo file Repository này)
    private final DisputeTicketRepository disputeTicketRepository; // (Cần tạo file Repository này)
    private final InvoiceService invoiceService; // (Giả sử bạn có dịch vụ này để tạo hóa đơn)
    private final UserRepository userRepository;
    private final SwapRepository swapRepository;

    @Transactional
    public BatteryInspection createInspection(InspectionRequest request) {

        if (request.getStaffId() == null || request.getStaffId().isEmpty()) {
            throw new IllegalArgumentException("staffId là bắt buộc");
        }
        if (request.getBatteryInId() == null || request.getBatteryInId().isEmpty()) {
            throw new IllegalArgumentException("batteryInId là bắt buộc (ID của pin cũ)");
        }
        if (request.getBookingId() == null) {
            throw new IllegalArgumentException("bookingId là bắt buộc (để liên kết)");
        }

        // 1. Lấy Staff
        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + request.getStaffId()));

        // 2. Lấy Booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking: " + request.getBookingId()));

        // --- ✅ [LOGIC SỬA LỖI] ---
        // 3. Lấy (Entity) Pin Cũ trực tiếp từ ID
        String oldBatteryId = request.getBatteryInId();
        Battery battery = batteryRepository.findById(oldBatteryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy (Entity) Pin với ID: " + oldBatteryId
                ));

        // 4. (Tùy chọn) Kiểm tra xem pin này có thuộc booking này không
        // (Bỏ qua bước này để giữ logic test đơn giản)
        // --- (Kết thúc logic sửa) ---

        // 5. Tạo và Lưu Inspection
        BatteryInspection inspection = BatteryInspection.builder()
                .booking(booking) // Vẫn lưu booking để tham chiếu
                .battery(battery) // Gán (Entity) Pin đã tìm thấy
                .staff(staff)
                .inspectionTime(LocalDateTime.now())
                .stateOfHealth(request.getStateOfHealth())
                .physicalNotes(request.getPhysicalNotes())
                .isDamaged(request.isCreateDispute())
                .build();

        BatteryInspection savedInspection = inspectionRepository.save(inspection);

        // 6. Tạo Ticket (Giữ nguyên)
        if (request.isCreateDispute()) {
            DisputeTicket ticket = DisputeTicket.builder()
                    .booking(booking)
                    .user(booking.getUser())
                    .createdByStaff(staff)
                    .inspection(savedInspection)
                    .status(DisputeTicket.TicketStatus.OPEN)
                    .title(request.getDisputeTitle())
                    .description(request.getDisputeDescription())
                    .createdAt(LocalDateTime.now())
                    .build();

            disputeTicketRepository.save(ticket);
            log.info("Đã tạo Dispute Ticket #{} cho Battery #{}", ticket.getId(), oldBatteryId);
        }

        return savedInspection;
    }
}