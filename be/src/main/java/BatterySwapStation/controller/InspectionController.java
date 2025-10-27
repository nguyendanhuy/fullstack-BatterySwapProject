package BatterySwapStation.controller;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.entity.BatteryInspection;
import BatterySwapStation.entity.DisputeTicket;
import BatterySwapStation.entity.User; // (Import User entity của bạn)
import BatterySwapStation.repository.DisputeTicketRepository;
import BatterySwapStation.repository.InspectionRepository;
import BatterySwapStation.service.InspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@Tag(name = "Inspection & Dispute (Staff)", description = "APIs cho Staff kiểm tra pin trả về (Yêu cầu 7)")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private DisputeTicketRepository disputeTicketRepository;

    // (Giả sử bạn có service để lấy User entity từ UserDetails)
    // @Autowired
    // private UserService userService;

    @PostMapping
    @Operation(summary = "Staff tạo Inspection (và Dispute)",
            description = "[TEST MODE] Staff gọi API này khi nhận pin cũ từ khách.")
    public ResponseEntity<Map<String, Object>> createInspection(
            @RequestBody InspectionRequest request
            // [TẠM XÓA] @AuthenticationPrincipal UserDetails staffDetails
    ) {
        try {
            // ✅ [SỬA] Gọi service mà không cần truyền 'staff'
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

    @GetMapping("/all")
    @Operation(summary = "Staff lấy TẤT CẢ Inspection",
            description = "Lấy danh sách tất cả các biên bản kiểm tra pin đã tạo, sắp xếp mới nhất lên đầu.")
    public ResponseEntity<?> getAllInspections() {
        // Dùng hàm sắp xếp mới
        return ResponseEntity.ok(inspectionRepository.findAllByOrderByInspectionTimeDesc());
    }


    @GetMapping("/disputes/open")
    @Operation(summary = "Staff lấy các Dispute (Tranh chấp) CHƯA XỬ LÝ",
            description = "Lấy tất cả các ticket tranh chấp đang ở trạng thái OPEN hoặc IN_PROGRESS.")
    public ResponseEntity<?> getOpenDisputes() {
        List<DisputeTicket.TicketStatus> statuses = List.of(
                DisputeTicket.TicketStatus.OPEN,
                DisputeTicket.TicketStatus.IN_PROGRESS
        );

        List<DisputeTicket> tickets = disputeTicketRepository.findByStatusIn(statuses);
        return ResponseEntity.ok(tickets);
    }
}