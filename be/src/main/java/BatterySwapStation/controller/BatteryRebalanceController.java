package BatterySwapStation.controller;

import BatterySwapStation.dto.RebalanceRequest;
import BatterySwapStation.dto.RebalanceSuggestion;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.BatteryRebalance;
import BatterySwapStation.entity.Station;
import BatterySwapStation.repository.StationRepository;
import BatterySwapStation.repository.BatteryRepository;
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
    private final StationRepository stationRepository;
    private final BatteryRepository batteryRepository; // ✅ thêm để BE tự chọn loại pin khi AI không có

    @Operation(summary = "Admin Lấy danh sách lệnh điều phối pin")
    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(rebalanceService.getAllOrders());
    }

    @Operation(summary = "Tạo lệnh điều phối mới (staff và admin gửi yêu cầu thủ công)")
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

    @Operation(summary = "Admin - Gợi ý điều phối từ AI (Linear Programming)")
    @GetMapping("/suggestions")
    public ResponseEntity<?> getAiSuggestions() {
        return ResponseEntity.ok(rebalanceService.getAiSuggestions());
    }

    @Operation(summary = "Admin - Áp dụng gợi ý AI → tạo lệnh điều phối thực tế")
    @PostMapping("/apply-ai")
    public ResponseEntity<?> applyAiSuggestion(@RequestBody RebalanceSuggestion suggestion) {
        // ✅ Tìm trạm theo tên
        Station from = stationRepository.findByStationName(suggestion.getFrom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm nguồn: " + suggestion.getFrom()));
        Station to = stationRepository.findByStationName(suggestion.getTo())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm đích: " + suggestion.getTo()));

        // ✅ Lấy loại pin: nếu AI có -> dùng, nếu không -> lấy loại phổ biến nhất ở trạm nguồn
        String batteryType = suggestion.getBatteryType();
        if (batteryType == null || batteryType.isBlank()) {
            batteryType = batteryRepository.findDominantBatteryTypeAtStation(from.getStationId())
                    .orElse("LITHIUM_ION");
        }

        // ✅ Tạo request điều phối
        RebalanceRequest req = new RebalanceRequest();
        req.setFromStationId(from.getStationId());
        req.setToStationId(to.getStationId());
        req.setBatteryType(Battery.BatteryType.valueOf(batteryType.toUpperCase()));
        req.setQuantity(suggestion.getQuantity());
        req.setNote("Áp dụng từ AI: " + suggestion.getReason());

        return ResponseEntity.ok(rebalanceService.createRebalanceOrder(req));
    }
}
