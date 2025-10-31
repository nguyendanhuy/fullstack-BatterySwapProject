package BatterySwapStation.controller;

import BatterySwapStation.dto.BatteryUpdateRequestDTO;
import BatterySwapStation.dto.BatteryUpdateResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.service.BatteryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import BatterySwapStation.dto.BatteryStatusUpdateRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/batteries")
@RequiredArgsConstructor
public class BatteryController {

    private final BatteryRepository batteryRepository;
    private final BatteryService batteryService;


    @Operation (summary = "Cập nhật trạng thái pin")
    @PatchMapping("/status")
    public ResponseEntity<?> updateBatteryStatus(@RequestBody BatteryStatusUpdateRequest request) {
        return ResponseEntity.ok(batteryService.updateBatteryStatus(request));
    }


    @Operation (summary = "lấy pin ra khỏi slot")
    @PostMapping("/eject/{batteryId}")
    public ResponseEntity<Map<String, Object>> ejectBattery(@PathVariable String batteryId) {
        return ResponseEntity.ok(batteryService.ejectBattery(batteryId));
    }

    @Operation (summary = "Thêm pin vào slot")
    @PostMapping("/insert")
    public ResponseEntity<Map<String, Object>> insertBattery(
            @RequestParam Integer slotId,
            @RequestParam String batteryId) {
        return ResponseEntity.ok(batteryService.insertBattery(slotId, batteryId));
    }

    @Operation(summary = "Lấy danh sách pin đang ở trạng thái chờ tại trạm (WAITING trong slot)")
    @GetMapping("/waiting")
    public ResponseEntity<?> getWaitingBatteries(@RequestParam Integer stationId) {
        return ResponseEntity.ok(batteryService.getWaitingBatteriesByStation(stationId));
    }


    @Operation(summary = "Lấy danh sách pin rời tại trạm (không nằm trong DockSlot)")
    @GetMapping("/loose")
    public ResponseEntity<?> getLooseBatteries(@RequestParam Integer stationId) {
        return ResponseEntity.ok(batteryService.getLooseBatteriesByStation(stationId));
    }


    @GetMapping("/{batteryId}")
    public ResponseEntity<?> getBatteryById(@PathVariable String batteryId) {
        return ResponseEntity.ok(batteryService.getBatteryDetail(batteryId));
    }



}
