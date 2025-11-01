package BatterySwapStation.service;

import BatterySwapStation.dto.TicketResponse;
import BatterySwapStation.dto.TicketUpdateRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService { // ✅ Đổi tên lớp

    // ✅ Giữ lại các Repository cần thiết cho Ticket
    private final BookingRepository bookingRepository;
    private final DisputeTicketRepository disputeTicketRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;

    // ----------------------------------------------------------------------
    // --- 1. TẠO DISPUTE TICKET (POST /tickets) ---
    // ----------------------------------------------------------------------
    @Transactional
    public DisputeTicket createDisputeTicket(Long bookingId,
                                             String staffId,
                                             String title,
                                             String description,
                                             String disputeReason,
                                             Integer stationId
    ) {
        // ... (Logic tạo Dispute Ticket giữ nguyên) ...

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking ID: " + bookingId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + staffId));

        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Station ID: " + stationId));

        DisputeTicket.DisputeReason reasonEnum;
        try {
            reasonEnum = DisputeTicket.DisputeReason.valueOf(disputeReason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Lý do tranh chấp không hợp lệ: " + disputeReason + ". Phải là BAD_CONDITION, SOH, hoặc OTHER.");
        }

        DisputeTicket ticket = DisputeTicket.builder()
                .booking(booking)
                .user(booking.getUser())
                .createdByStaff(staff)
                .station(station)
                .status(DisputeTicket.TicketStatus.OPEN)
                .title(title)
                .description(description)
                .reason(reasonEnum)
                .createdAt(LocalDateTime.now())
                .build();

        DisputeTicket savedTicket = disputeTicketRepository.save(ticket);
        log.info("Đã tạo Dispute Ticket #{} liên kết với Booking #{}", savedTicket.getId(), bookingId);

        return savedTicket;
    }

    // -------------------------------------------------------------------
    // --- 2. LẤY TICKET THEO STAFF ĐÃ TẠO (GET /tickets/staff/{id}) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getDisputesByStaffId(String staffUserId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByCreatedByStaff_UserId(staffUserId);

        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // -------------------------------------------------------------------
    // --- 3. CẬP NHẬT TICKET (PUT /tickets/{id}) ---
    // -------------------------------------------------------------------
    @Transactional
    public TicketResponse updateTicket(Long ticketId, TicketUpdateRequest request) {
        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại với ID: " + ticketId));

        if (request.getNewDescription() != null) {
            ticket.setDescription(request.getNewDescription());
        }

        if (request.getNewStatus() != null) {
            try {
                ticket.setStatus(DisputeTicket.TicketStatus.valueOf(request.getNewStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái ticket không hợp lệ: " + request.getNewStatus());
            }
        }

        if (request.getNewReason() != null) {
            try {
                ticket.setReason(DisputeTicket.DisputeReason.valueOf(request.getNewReason().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Lý do ticket không hợp lệ: " + request.getNewReason());
            }
        }

        DisputeTicket updatedTicket = disputeTicketRepository.save(ticket);
        return convertToTicketResponse(updatedTicket);
    }

    // -------------------------------------------------------------------
    // --- 4. LẤY TICKET ĐANG MỞ (GET /tickets/open) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getOpenDisputes() {
        List<DisputeTicket.TicketStatus> statuses = List.of(
                DisputeTicket.TicketStatus.OPEN,
                DisputeTicket.TicketStatus.IN_PROGRESS
        );
        List<DisputeTicket> tickets = disputeTicketRepository.findByStatusIn(statuses);
        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // -------------------------------------------------------------------
    // --- 5. LẤY TICKET THEO TRẠM (GET /tickets/by-station) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getDisputesByStation(Integer stationId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByStation_StationIdOrderByCreatedAtDesc(stationId);
        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // ---------------------------------
    // --- HÀM HELPER (CHUYỂN ĐỔI DTO) ---
    // ---------------------------------
    private TicketResponse convertToTicketResponse(DisputeTicket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setBookingId(ticket.getBooking() != null ? ticket.getBooking().getBookingId() : null);
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus().name());
        res.setCreatedAt(ticket.getCreatedAt());
        if (ticket.getReason() != null) {
            res.setReason(ticket.getReason().name());
        }
        if (ticket.getCreatedByStaff() != null) {
            res.setCreatedByStaffName(ticket.getCreatedByStaff().getFullName());
        }
        return res;
    }
}