package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.BatteryRebalance;
import BatterySwapStation.service.BatteryRebalanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rebalances")
@RequiredArgsConstructor
@Tag(name = "Battery Rebalance API", description = "Quản lý điều phối pin giữa các trạm")
public class BatteryRebalanceController {

    private final BatteryRebalanceService rebalanceService;

    @Operation(summary = "Lấy danh sách lệnh điều phối pin")
    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(rebalanceService.getAllOrders());
    }

    @Operation(summary = "Tạo lệnh điều phối mới")
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody RebalanceRequest dto) {
        return ResponseEntity.ok(rebalanceService.createRebalanceOrder(dto));
    }

    @Operation(summary = "Cập nhật trạng thái lệnh điều phối")
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam("status") BatteryRebalance.RebalanceStatus status) {
        return ResponseEntity.ok(rebalanceService.updateStatus(id, status));
    }

    @Operation(summary = "Gợi ý điều phối từ heuristic AI")
    @GetMapping("/suggestions")
    public ResponseEntity<?> getAiSuggestions() {
        return ResponseEntity.ok(rebalanceService.getAiSuggestions());
    }
}
