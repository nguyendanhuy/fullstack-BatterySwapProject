package BatterySwapStation.service;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.dto.InspectionResponse;
import BatterySwapStation.dto.InspectionUpdateRequest;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionService {

    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;
    private final BatteryInspectionRepository inspectionRepository;
    private final DisputeTicketRepository disputeTicketRepository;
    private final InvoiceService invoiceService;
    private final UserRepository userRepository;
    private final SwapRepository swapRepository;
    private final StationRepository stationRepository;

    // ----------------------------------------------------
    // --- 1. TẠO INSPECTION (POST /inspections) ---
    // ----------------------------------------------------
    @Transactional
    public BatteryInspection createInspection(InspectionRequest request) {

        // (Giữ nguyên phần kiểm tra dữ liệu đầu vào)
        if (request.getStaffId() == null || request.getStaffId().isEmpty()) {
            throw new IllegalArgumentException("staffId là bắt buộc");
        }
        if (request.getBatteryInId() == null || request.getBatteryInId().isEmpty()) {
            throw new IllegalArgumentException("batteryInId là bắt buộc (ID của pin cũ)");
        }
        if (request.getBookingId() == null) {
            throw new IllegalArgumentException("bookingId là bắt buộc (để liên kết)");
        }

        // 1. Lấy Staff, Booking, Battery (Giữ nguyên)
        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + request.getStaffId()));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking: " + request.getBookingId()));

        String oldBatteryId = request.getBatteryInId();
        Battery battery = batteryRepository.findById(oldBatteryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy (Entity) Pin với ID: " + oldBatteryId
                ));

        // 2. Tạo và Lưu Inspection
        BatteryInspection inspection = BatteryInspection.builder()
                .booking(booking)
                .battery(battery)
                .staff(staff)
                .inspectionTime(LocalDateTime.now())
                .stateOfHealth(request.getStateOfHealth())
                .physicalNotes(request.getPhysicalNotes())
                .build();

        BatteryInspection savedInspection = inspectionRepository.save(inspection);
        return savedInspection;
    }

    // ----------------------------------------------------------------------
// HÀM MỚI: TẠO DISPUTE TICKET (POST /tickets)
// ----------------------------------------------------------------------
    @Transactional
    public DisputeTicket createDisputeTicket(Long inspectionId, String staffId, String title, String description, String disputeReason, Integer stationId) {

        // 1. Lấy Inspection (Khóa chính)
        BatteryInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Inspection ID: " + inspectionId));

        // 2. Kiểm tra xem Ticket đã tồn tại cho Inspection này chưa (Tùy chọn)
        // List<DisputeTicket> existingTickets = disputeTicketRepository.findByInspectionId(inspectionId);
        // if (!existingTickets.isEmpty()) { throw new IllegalStateException("Ticket đã tồn tại cho Inspection này."); }

        // 3. Lấy Staff (người đang tạo Ticket)
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + staffId));

        // 3. Lấy Station ✅ BƯỚC MỚI
        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Station ID: " + stationId));

        // ✅ Thêm kiểm tra và chuyển đổi Enum
        DisputeTicket.DisputeReason reasonEnum;
        try {
            reasonEnum = DisputeTicket.DisputeReason.valueOf(disputeReason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Lý do tranh chấp không hợp lệ: " + disputeReason + ". Phải là BAD_CONDITION, SOH, hoặc OTHER.");
        }

        // 4. Tạo Ticket
        DisputeTicket ticket = DisputeTicket.builder()
                .booking(inspection.getBooking())
                .user(inspection.getBooking().getUser()) // Lấy Customer từ Booking
                .createdByStaff(staff) // Staff hiện tại đang tạo Ticket
                .inspection(inspection)
                .station(station)
                .status(DisputeTicket.TicketStatus.OPEN)
                .title(title)
                .description(description)
                .reason(reasonEnum)
                .createdAt(LocalDateTime.now())
                .build();

        DisputeTicket savedTicket = disputeTicketRepository.save(ticket);
        log.info("Đã tạo Dispute Ticket #{} liên kết với Inspection #{}", savedTicket.getId(), inspectionId);

        return savedTicket;
    }

    // -----------------------------------------------------
    // --- 2. LẤY TẤT CẢ INSPECTION (GET /all) ---
    // -----------------------------------------------------
    public List<InspectionResponse> getAllInspections() {
        List<BatteryInspection> inspections = inspectionRepository.findAllByOrderByInspectionTimeDesc();
        return inspections.stream()
                .map(this::convertToInspectionResponse)
                .toList();
    }

    // -------------------------------------------------------
    // --- 3. CẬP NHẬT INSPECTION (PUT /{id}) ---
    // -------------------------------------------------------
    @Transactional
    public InspectionResponse updateInspection(Long inspectionId, InspectionUpdateRequest request) {
        BatteryInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new EntityNotFoundException("Inspection không tồn tại với ID: " + inspectionId));

        if (request.getStateOfHealth() != null) {
            inspection.setStateOfHealth(request.getStateOfHealth());
        }
        if (request.getPhysicalNotes() != null) {
            inspection.setPhysicalNotes(request.getPhysicalNotes());
        }
        if (request.getDamaged() != null) {
            inspection.setDamaged(request.getDamaged());
        }

        BatteryInspection updatedInspection = inspectionRepository.save(inspection);
        return convertToInspectionResponse(updatedInspection);
    }

    // -------------------------------------------------------------------
    // --- 4. LẤY TICKET THEO STAFF ĐÃ TẠO (GET /tickets/staff/{id}) ---
    // -------------------------------------------------------------------
    // ✅ Đã sửa lỗi trùng lặp. Trả về List<TicketResponse>
    public List<TicketResponse> getDisputesByStaffId(String staffUserId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByCreatedByStaff_UserId(staffUserId);

        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // -------------------------------------------------------------------
    // --- 5. CẬP NHẬT TICKET (PUT /tickets/{id}) ---
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

        // ✅ THÊM LOGIC CẬP NHẬT REASON:
        if (request.getNewReason() != null) {
            try {
                // Chuyển đổi chuỗi thành Enum
                ticket.setReason(DisputeTicket.DisputeReason.valueOf(request.getNewReason().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Lý do ticket không hợp lệ: " + request.getNewReason());
            }
        }

        DisputeTicket updatedTicket = disputeTicketRepository.save(ticket);
        return convertToTicketResponse(updatedTicket);
    }

    // -------------------------------------------------------------------
    // --- 6. LẤY TICKET ĐANG MỞ (GET /tickets/open) ---
    // -------------------------------------------------------------------
    // ✅ Sửa để trả về List<TicketResponse> nhất quán
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
    // --- 7. LẤY TICKET THEO TRẠM (GET /tickets/by-station) ---
    // -------------------------------------------------------------------
    // ✅ Sửa để trả về List<TicketResponse> nhất quán
    public List<TicketResponse> getDisputesByStation(Integer stationId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByStation_StationIdOrderByCreatedAtDesc(stationId);
        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }


    // ---------------------------------
    // --- HÀM HELPER (CHUYỂN ĐỔI DTO) ---
    // ---------------------------------

    private InspectionResponse convertToInspectionResponse(BatteryInspection inspection) {
        InspectionResponse ins = new InspectionResponse();
        ins.setId(inspection.getId());
        ins.setInspectionTime(inspection.getInspectionTime());
        ins.setStateOfHealth(inspection.getStateOfHealth());
        ins.setPhysicalNotes(inspection.getPhysicalNotes());
        ins.setDamaged(inspection.isDamaged());

        if (inspection.getBattery() != null) {
            ins.setBatteryId(inspection.getBattery().getBatteryId());
        }

        return ins;
    }

    // ✅ Hàm helper đã được chỉnh sửa
    private TicketResponse convertToTicketResponse(DisputeTicket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setInspectionId(ticket.getInspection() != null ? ticket.getInspection().getId() : null);
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

    // ✅ THÊM PHƯƠNG THỨC NÀY
    public List<InspectionResponse> getInspectionsByStaff(String staffId) {
        // 1. Lấy danh sách Inspection từ DB
        List<BatteryInspection> inspections = inspectionRepository.findByStaffUserId(staffId);

        // 2. Chuyển đổi List<BatteryInspection> sang List<InspectionResponse>
        return inspections.stream()
                .map(this::convertToInspectionResponse)
                .collect(Collectors.toList());
    }
}