package BatterySwapStation.controller;

import BatterySwapStation.dto.BatteryUpdateRequestDTO;
import BatterySwapStation.dto.BatteryUpdateResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.repository.BatteryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/batteries")
@RequiredArgsConstructor
public class BatteryController {

    private final BatteryRepository batteryRepository;

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
}
