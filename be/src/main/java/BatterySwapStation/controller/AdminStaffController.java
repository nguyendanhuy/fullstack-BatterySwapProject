package BatterySwapStation.controller;

import BatterySwapStation.dto.CreateStaffRequest;
import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.dto.UpdateStaffAssignRequest;
import BatterySwapStation.service.StaffService;
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
    public ResponseEntity<?> createStaff(@RequestBody CreateStaffRequest req) {
        return ResponseEntity.ok(staffService.createStaff(req));
    }

    @GetMapping
    public ResponseEntity<List<StaffListItemDTO>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

    @PutMapping("/{staffId}")
    public ResponseEntity<StaffListItemDTO> updateStaffAssign(
            @PathVariable String staffId,
            @RequestBody UpdateStaffAssignRequest req
    ) {
        return ResponseEntity.ok(staffService.updateStaffAssign(staffId, req));
    }

    @DeleteMapping("/{staffId}/unassign")
    public ResponseEntity<?> unassignStaff(@PathVariable String staffId) {
        staffService.unassignStaff(staffId);
        return ResponseEntity.ok(Map.of("message", "Staff đã được hủy assign khỏi trạm."));
    }
}
