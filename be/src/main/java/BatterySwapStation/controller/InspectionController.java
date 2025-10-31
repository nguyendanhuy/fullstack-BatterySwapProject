package BatterySwapStation.controller;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.dto.InspectionResponse;
import BatterySwapStation.dto.InspectionUpdateRequest; // ✅ NEW IMPORT
import BatterySwapStation.dto.TicketResponse;        // ✅ NEW IMPORT
import BatterySwapStation.dto.TicketUpdateRequest;      // ✅ NEW IMPORT
import BatterySwapStation.entity.BatteryInspection;
import BatterySwapStation.entity.DisputeTicket;
import BatterySwapStation.service.InspectionService; // Service đã được gộp
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff") // Đổi tên Base path cho dễ quản lý
@Tag(name = "Staff: Inspection & Ticket", description = "Quản lý Kiểm tra Pin (Inspection) và Ticket Tranh chấp")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService; // Dùng Service đã gộp

    // --- 1. POST: TẠO INSPECTION (Kiểm tra Pin) ---
    @PostMapping("/inspections") // Đã thêm /inspections
    @Operation(summary = "Staff tạo Inspection (và Dispute)",
            description = "Ghi nhận biên bản kiểm tra pin cũ (bước đầu tiên).")
    public ResponseEntity<Map<String, Object>> createInspection(
            @RequestBody InspectionRequest request
    ) {
        try {
            BatteryInspection inspection = inspectionService.createInspection(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Ghi nhận kiểm tra thành công.",
                    "inspectionId", inspection.getId(),
                    "disputeCreated", inspection.isDamaged()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // --- 2. GET: LẤY TẤT CẢ INSPECTION ---
    @GetMapping("/inspections/all")
    @Operation(summary = "Staff lấy TẤT CẢ Inspection",
            description = "Lấy danh sách tất cả các biên bản kiểm tra pin đã tạo.")
    public ResponseEntity<List<InspectionResponse>> getAllInspections() {
        List<InspectionResponse> inss = inspectionService.getAllInspections();
        return ResponseEntity.ok(inss);
    }

    // --- 3. PUT: CẬP NHẬT INSPECTION ---
    @PutMapping("/inspections/{inspectionId}")
    @Operation(summary = "Cập nhật Inspection",
            description = "Staff cập nhật thông tin chi tiết của biên bản kiểm tra pin.")
    public ResponseEntity<InspectionResponse> updateInspection(
            @PathVariable Long inspectionId,
            @RequestBody InspectionUpdateRequest request) {

        InspectionResponse response = inspectionService.updateInspection(inspectionId, request);
        return ResponseEntity.ok(response);
    }


    // Trong InspectionController.java

    // --- 4. GET: LẤY TICKET THEO STAFF ---
    @GetMapping("/tickets/staff/{staffUserId}")
    @Operation(summary = "Staff lấy Ticket được giao",
            description = "Lấy danh sách các ticket tranh chấp đã được TẠO bởi Staff này.")
    public ResponseEntity<List<TicketResponse>> getDisputesByStaff(@PathVariable String staffUserId) {

        // Service trả về List<TicketResponse>
        List<TicketResponse> response = inspectionService.getDisputesByStaffId(staffUserId);

        return ResponseEntity.ok(response);
    }

    // --- 5. PUT: CẬP NHẬT TICKET ---
    @PutMapping("/tickets/{ticketId}")
    @Operation(summary = "Cập nhật Dispute Ticket",
            description = "Staff/Admin thay đổi trạng thái, mô tả, hoặc gán lại Staff cho Ticket.")
    public ResponseEntity<TicketResponse> updateDisputeTicket(
            @PathVariable Long ticketId,
            @RequestBody TicketUpdateRequest request) {

        TicketResponse response = inspectionService.updateTicket(ticketId, request); // Dùng InspectionService
        return ResponseEntity.ok(response);
    }

    // --- SỬA: 6. GET: LẤY OPEN DISPUTES ---
    @GetMapping("/tickets/open")
    @Operation(summary = "Staff lấy các Dispute CHƯA XỬ LÝ")
    public ResponseEntity<List<TicketResponse>> getOpenDisputes() {
        List<TicketResponse> tickets = inspectionService.getOpenDisputes();
        return ResponseEntity.ok(tickets);
    }

    // --- SỬA: 7. GET: DISPUTES BY STATION ---
    @GetMapping("/tickets/by-station")
    @Operation(summary = "Staff lấy Dispute (Tranh chấp) theo Trạm")
    public ResponseEntity<Map<String, Object>> getDisputesByStation(
            @RequestParam @NotNull Integer stationId
    ) {
        try {
            List<TicketResponse> tickets = inspectionService.getDisputesByStation(stationId);

            // Chú ý: Vì bạn trả về Map<String, Object>, nên bạn phải sửa Map này
            if (tickets.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Không tìm thấy ticket nào cho trạm " + stationId,
                        "tickets", tickets // Vẫn là List<TicketResponse>
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Lấy danh sách ticket cho trạm " + stationId + " thành công.",
                    "tickets", tickets // Vẫn là List<TicketResponse>
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}