package BatterySwapStation.controller;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.entity.BatteryInspection;
import BatterySwapStation.entity.User; // (Import User entity của bạn)
import BatterySwapStation.service.InspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@Tag(name = "Inspection & Dispute (Staff)", description = "APIs cho Staff kiểm tra pin trả về (Yêu cầu 7)")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

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
}