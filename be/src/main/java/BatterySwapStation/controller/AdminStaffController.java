package BatterySwapStation.controller;

import BatterySwapStation.dto.CreateStaffRequest;
import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.dto.UpdateStaffAssignRequest;
import BatterySwapStation.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "tạo tk cho staff")
    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody CreateStaffRequest req) {
        return ResponseEntity.ok(staffService.createStaff(req));
    }
    @Operation(summary = "lấy danh sách tất cả staff")
    @GetMapping
    public ResponseEntity<List<StaffListItemDTO>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
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
