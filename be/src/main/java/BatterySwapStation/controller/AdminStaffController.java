package BatterySwapStation.controller;

import BatterySwapStation.dto.CreateStaffRequest;
import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.dto.StationStaffGroupDTO;
import BatterySwapStation.dto.UpdateStaffAssignRequest;
import BatterySwapStation.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final StaffService staffService;

    @PostMapping
    @Operation(summary = "Tạo tài khoản cho staff")
    public ResponseEntity<?> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return ResponseEntity.ok(staffService.createStaff(req));
    }


    @Operation(summary = "Lấy danh sách staff bth")
    @GetMapping("/list")
    public ResponseEntity<List<StaffListItemDTO>> getAllStaffFlat() {
        List<StaffListItemDTO> list = staffService.getAllStaffFlat();
        return ResponseEntity.ok(list);
    }
    @Operation(summary = "Lấy danh sách staff được group theo trạm")
    @GetMapping
    public ResponseEntity<List<StationStaffGroupDTO>> getAllStaffGrouped() {
        return ResponseEntity.ok(staffService.getAllStaffGroupedByStation());
    }

    @Operation(summary = "assign staff, có thể null station id nếu chỉ đổi isactive")
    @PutMapping("/{staffId}")
    public ResponseEntity<StaffListItemDTO> updateStaffAssign(
            @PathVariable String staffId,
            @RequestBody UpdateStaffAssignRequest req
    ) {
        return ResponseEntity.ok(staffService.updateStaffAssign(staffId, req));
    }
    @Operation(summary = "hủy assgin staff")
    @DeleteMapping("/{staffId}/unassign")
    public ResponseEntity<?> unassignStaff(@PathVariable String staffId) {
        staffService.unassignStaff(staffId);
        return ResponseEntity.ok(Map.of("message", "Staff đã được hủy assign khỏi trạm."));
    }


    @Operation (summary = "lấy danh sách staff theo trạm")
    @GetMapping("/station/{stationId}")
    public ResponseEntity<List<StaffListItemDTO>> getStaffByStation(@PathVariable Integer stationId) {
        List<StaffListItemDTO> list = staffService.getStaffByStation(stationId);
        return ResponseEntity.ok(list);
    }
}
