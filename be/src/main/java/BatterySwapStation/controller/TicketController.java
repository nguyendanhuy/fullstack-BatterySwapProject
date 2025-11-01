package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.DisputeTicket;
import BatterySwapStation.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/tickets") // Base path chỉ dành cho tickets
@Tag(name = "Staff: Dispute Ticket", description = "Quản lý Ticket Tranh chấp")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    // --- POST: TẠO DISPUTE TICKET ---
    @PostMapping
    @Operation(summary = "Tạo Dispute Ticket",
            description = "Staff tạo Ticket tranh chấp liên kết với Booking và Trạm.")
    public ResponseEntity<Map<String, Object>> createDisputeTicket(
            @RequestBody TicketRequest request // Đổi tên DTO thành DisputeTicketCreationRequest
    ) {
        try {
            DisputeTicket ticket = ticketService.createDisputeTicket(
                    request.getBookingId(),
                    request.getStaffId(),
                    request.getTitle(),
                    request.getDescription(),
                    request.getDisputeReason(),
                    request.getStationId()
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo Dispute Ticket thành công.",
                    "ticketId", ticket.getId(),
                    "bookingId", request.getBookingId(),
                    "stationId", request.getStationId()
            ));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Lỗi không xác định khi tạo ticket: " + e.getMessage()));
        }
    }

    // --- GET: LẤY TICKET THEO STAFF ---
    @GetMapping("/staff/{staffUserId}")
    @Operation(summary = "Staff lấy Ticket đã tạo",
            description = "Lấy danh sách các ticket tranh chấp đã được TẠO bởi Staff này.")
    public ResponseEntity<List<TicketResponse>> getDisputesByStaff(@PathVariable String staffUserId) {
        List<TicketResponse> response = ticketService.getDisputesByStaffId(staffUserId);
        return ResponseEntity.ok(response);
    }

    // --- PUT: CẬP NHẬT TICKET ---
    @PutMapping("/{ticketId}")
    @Operation(summary = "Cập nhật Dispute Ticket",
            description = "Staff/Admin thay đổi trạng thái, mô tả, hoặc lý do cho Ticket.")
    public ResponseEntity<TicketResponse> updateDisputeTicket(
            @PathVariable Long ticketId,
            @RequestBody TicketUpdateRequest request) {

        TicketResponse response = ticketService.updateTicket(ticketId, request);
        return ResponseEntity.ok(response);
    }

    // --- GET: LẤY OPEN DISPUTES ---
    @GetMapping("/open")
    @Operation(summary = "Staff lấy các Dispute CHƯA XỬ LÝ")
    public ResponseEntity<List<TicketResponse>> getOpenDisputes() {
        List<TicketResponse> tickets = ticketService.getOpenDisputes();
        return ResponseEntity.ok(tickets);
    }

    // --- GET: DISPUTES BY STATION ---
    @GetMapping("/by-station")
    @Operation(summary = "Staff lấy Dispute (Tranh chấp) theo Trạm")
    public ResponseEntity<Map<String, Object>> getDisputesByStation(
            @RequestParam @NotNull Integer stationId
    ) {
        try {
            List<TicketResponse> tickets = ticketService.getDisputesByStation(stationId);

            if (tickets.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Không tìm thấy ticket nào cho trạm " + stationId,
                        "tickets", tickets
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Lấy danh sách ticket cho trạm " + stationId + " thành công.",
                    "tickets", tickets
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}