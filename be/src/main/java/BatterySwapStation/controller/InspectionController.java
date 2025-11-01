package BatterySwapStation.controller;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.dto.InspectionResponse;
import BatterySwapStation.dto.InspectionUpdateRequest;
import BatterySwapStation.entity.BatteryInspection;
import BatterySwapStation.service.InspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/inspections") // Base path chỉ dành cho inspections
@Tag(name = "Staff: Inspection", description = "Quản lý Kiểm tra Pin (Inspection)")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    // --- POST: TẠO INSPECTION ---
    @PostMapping
    @Operation(summary = "Staff tạo Inspection",
            description = "Ghi nhận biên bản kiểm tra pin do người dùng bỏ vào.")
    public ResponseEntity<Map<String, Object>> createInspection(
            @RequestBody InspectionRequest request
    ) {
        try {
            BatteryInspection inspection = inspectionService.createInspection(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Ghi nhận kiểm tra thành công.",
                    "inspectionId", inspection.getId(),
                    "isDamaged", inspection.isDamaged() // Trả về trạng thái bị hỏng của pin
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // --- GET: LẤY TẤT CẢ INSPECTION ---
    @GetMapping("/all")
    @Operation(summary = "Staff lấy TẤT CẢ Inspection",
            description = "Lấy danh sách tất cả các biên bản kiểm tra pin đã tạo.")
    public ResponseEntity<List<InspectionResponse>> getAllInspections() {
        List<InspectionResponse> inss = inspectionService.getAllInspections();
        return ResponseEntity.ok(inss);
    }

    // --- PUT: CẬP NHẬT INSPECTION ---
    @PutMapping("/{inspectionId}")
    @Operation(summary = "Cập nhật Inspection",
            description = "Staff cập nhật thông tin chi tiết của biên bản kiểm tra pin.")
    public ResponseEntity<InspectionResponse> updateInspection(
            @PathVariable Long inspectionId,
            @RequestBody InspectionUpdateRequest request) {

        InspectionResponse response = inspectionService.updateInspection(inspectionId, request);
        return ResponseEntity.ok(response);
    }

    // --- GET: LẤY INSPECTION THEO STAFF ---
    @GetMapping("/staff/{staffUserId}")
    @Operation(summary = "Lấy danh sách Inspection được thực hiện bởi Staff",
            description = "Lấy danh sách các Inspection do Staff có ID này thực hiện.")
    public ResponseEntity<List<InspectionResponse>> getInspectionsByStaff(
            @Parameter(description = "ID của Staff, ví dụ: ST006")
            @PathVariable String staffUserId) {

        List<InspectionResponse> inspections = inspectionService.getInspectionsByStaff(staffUserId);

        if (inspections.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        return ResponseEntity.ok(inspections);
    }
}