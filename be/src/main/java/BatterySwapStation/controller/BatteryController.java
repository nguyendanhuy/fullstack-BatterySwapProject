package BatterySwapStation.controller;

import BatterySwapStation.dto.BatteryUpdateRequestDTO;
import BatterySwapStation.dto.BatteryUpdateResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.service.BatteryService;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import BatterySwapStation.dto.BatteryStatusUpdateRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/batteries")
@RequiredArgsConstructor
public class BatteryController {

    private final BatteryRepository batteryRepository;
    private final BatteryService batteryService;

    @Schema (description = "KHONG SU DUNG - Cập nhật thông tin pin")
    @PatchMapping("/{id}")
    public ResponseEntity<BatteryUpdateResponseDTO> updateBattery(
            @PathVariable String id,
            @RequestBody BatteryUpdateRequestDTO request) {

        Battery battery = batteryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin: " + id));

        if (request.getBatteryStatus() != null) {
            battery.setBatteryStatus(Battery.BatteryStatus.valueOf(request.getBatteryStatus().toUpperCase()));
        }

        if (request.getStateOfHealth() != null) {
            battery.setStateOfHealth(request.getStateOfHealth());
        }

        batteryRepository.save(battery);

        BatteryUpdateResponseDTO response = BatteryUpdateResponseDTO.builder()
                .batteryId(battery.getBatteryId())
                .batteryStatus(battery.getBatteryStatus().name())
                .stateOfHealth(battery.getStateOfHealth())
                .message("Cập nhật pin thành công")
                .build();

        return ResponseEntity.ok(response);
    }

    @Schema (description = "Cập nhật trạng thái pin")
    @PatchMapping("/status")
    public ResponseEntity<?> updateBatteryStatus(@RequestBody BatteryStatusUpdateRequest request) {
        return ResponseEntity.ok(batteryService.updateBatteryStatus(request));
    }


    @Schema (description = "lấy pin ra khỏi slot")
    @PostMapping("/eject/{batteryId}")
    public ResponseEntity<Map<String, Object>> ejectBattery(@PathVariable String batteryId) {
        return ResponseEntity.ok(batteryService.ejectBattery(batteryId));
    }

    @Schema (description = "Thêm pin vào slot")
    @PostMapping("/insert")
    public ResponseEntity<Map<String, Object>> insertBattery(
            @RequestParam Integer slotId,
            @RequestParam String batteryId) {
        return ResponseEntity.ok(batteryService.insertBattery(slotId, batteryId));
    }


}
