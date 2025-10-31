package BatterySwapStation.service;

import BatterySwapStation.dto.BatteryDetailDTO;
import BatterySwapStation.dto.BatteryRealtimeEvent;
import BatterySwapStation.dto.BatteryStatusUpdateRequest;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import BatterySwapStation.repository.SwapRepository;
import BatterySwapStation.websocket.BatterySocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BatteryService {

    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;
    private final BatterySocketController batterySocketController;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SwapRepository swapRepository;
    // ==================== TỰ ĐỘNG SẠC ====================
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoChargeBatteries() {
        List<Battery> chargingBatteries = batteryRepository.findByBatteryStatus(Battery.BatteryStatus.CHARGING);

        for (Battery battery : chargingBatteries) {
            double current = battery.getCurrentCapacity() == null ? 0.0 : battery.getCurrentCapacity();
            current += 10.0;

            boolean fullyCharged = current >= 100.0;
            if (fullyCharged) {
                current = 100.0;
                battery.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            }

            battery.setCurrentCapacity(current);
            batteryRepository.save(battery);

            if (battery.getDockSlot() != null) {
                DockSlot slot = battery.getDockSlot();
                String action = fullyCharged ? "CHARGING_COMPLETE" : "CHARGING_PROGRESS";
                sendRealtimeUpdate(slot, action, battery.getBatteryStatus().name(), battery);
            }
        }
    }

    // ==================== RÚT PIN ====================
    @Transactional
    public Map<String, Object> ejectBattery(String batteryId) {
        Battery battery = batteryRepository.findById(batteryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin: " + batteryId));

        DockSlot slot = battery.getDockSlot();
        if (slot == null)
            throw new IllegalStateException("Pin không nằm trong dock nào.");

        var dock = slot.getDock();
        var station = dock.getStation();

        slot.setBattery(null);
        slot.setSlotStatus(DockSlot.SlotStatus.EMPTY);
        dockSlotRepository.save(slot);

        battery.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        battery.setDockSlot(null);
        battery.setStationId(null);
        batteryRepository.save(battery);

        sendRealtimeUpdate(slot, "EJECTED", "EMPTY", battery);

        return Map.of(
                "batteryId", batteryId,
                "stationId", station.getStationId(),
                "dockName", dock.getDockName(),
                "slotNumber", slot.getSlotNumber(),
                "batteryStatus", "EMPTY",
                "action", "EJECTED"
        );
    }

    // ==================== ĐÚT PIN ====================
    @Transactional
    public Map<String, Object> insertBattery(Integer slotId, String batteryId) {
        DockSlot slot = dockSlotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy slot #" + slotId));

        Battery battery = batteryRepository.findById(batteryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin: " + batteryId));

        if (slot.getBattery() != null)
            throw new IllegalStateException("Slot này đã có pin khác.");

        var dock = slot.getDock();
        var station = dock.getStation();

        slot.setBattery(battery);
        slot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        dockSlotRepository.save(slot);

        battery.setBatteryStatus(Battery.BatteryStatus.WAITING);
        battery.setStationId(station.getStationId());
        battery.setDockSlot(slot);
        batteryRepository.save(battery);

        sendRealtimeUpdate(slot, "INSERTED", "WAITING", battery);
        return Map.of(
                "batteryId", batteryId,
                "stationId", station.getStationId(),
                "action", "INSERTED"
        );
    }

    // ==================== CẬP NHẬT TRẠNG THÁI ====================
    @Transactional
    public Map<String, Object> updateBatteryStatus(BatteryStatusUpdateRequest req) {
        Battery battery = batteryRepository.findById(req.getBatteryId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy pin " + req.getBatteryId()));

        battery.setBatteryStatus(req.getNewStatus());
        batteryRepository.save(battery);

        if (battery.getDockSlot() != null) {
            DockSlot slot = battery.getDockSlot();
            sendRealtimeUpdate(slot, "STATUS_CHANGED", req.getNewStatus().name(), battery);
        }

        return Map.of(
                "batteryId", battery.getBatteryId(),
                "newStatus", battery.getBatteryStatus()
        );
    }

    // ==================== GỬI REALTIME ====================
    private void sendRealtimeUpdate(DockSlot slot, String action, String status, Battery battery) {
        try {
            BatteryRealtimeEvent event = BatteryRealtimeEvent.builder()
                    .stationId(slot.getDock().getStation().getStationId())
                    .dockId(slot.getDockSlotId())
                    .dockName(slot.getDock().getDockName())
                    .slotNumber(slot.getSlotNumber())
                    .batteryId(battery != null ? battery.getBatteryId() : null)
                    .batteryStatus(status)
                    .stateOfHealth(battery != null ? battery.getStateOfHealth() : null)
                    .currentCapacity(battery != null ? battery.getCurrentCapacity() : null)
                    .action(action)
                    .timestamp(LocalDateTime.now().toString())
                    .build();

            String json = objectMapper.writeValueAsString(event);
            batterySocketController.broadcastToStation(event.getStationId(), json);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    // ==================== PIN ĐANG CHỜ TẠI TRẠM ====================
    @Transactional
    public List<Map<String, Object>> getWaitingBatteriesByStation(Integer stationId) {
        List<Battery> list = batteryRepository.findWaitingBatteriesByStation(stationId);

        return list.stream()
                .map(battery -> {
                    Map<String, Object> result = new java.util.HashMap<>();

                    DockSlot slot = battery.getDockSlot();
                    result.put("batteryId", battery.getBatteryId());
                    result.put("batteryType", battery.getBatteryType());
                    result.put("stateOfHealth", battery.getStateOfHealth());

                    if (slot != null && slot.getDock() != null) {
                        result.put("dockName", slot.getDock().getDockName());
                        result.put("slotNumber", slot.getSlotNumber());
                    } else {
                        result.put("dockName", null);
                        result.put("slotNumber", null);
                    }

                    return result;
                })
                .toList();
    }


    // ==================== PIN RỜI TRONG TRẠM (KHÔNG TRONG DOCKSLOT) ====================
    @Transactional
    public List<Map<String, Object>> getLooseBatteriesByStation(Integer stationId) {
        List<Battery> list = batteryRepository.findAllLooseBatteriesByStation(stationId);

        return list.stream()
                .map(b -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("batteryId", b.getBatteryId());
                    map.put("batteryType", b.getBatteryType());
                    map.put("batteryStatus", b.getBatteryStatus());
                    map.put("stateOfHealth", b.getStateOfHealth());
                    map.put("currentCapacity", b.getCurrentCapacity());
                    map.put("stationId", b.getStationId());
                    return map;
                })
                .toList();
    }



    public BatteryDetailDTO getBatteryDetail(String batteryId) {
        Battery battery = batteryRepository.findById(batteryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin: " + batteryId));

        long swapCount = swapRepository.countSwapsByBattery(batteryId);

        DockSlot slot = battery.getDockSlot();

        return BatteryDetailDTO.builder()
                .stationId(battery.getStationId())
                .stationName(slot != null ? slot.getDock().getStation().getStationName() : null)
                .dockId(slot != null ? slot.getDock().getDockId() : null)
                .dockName(slot != null ? slot.getDock().getDockName() : null)
                .dockSlotId(slot != null ? slot.getDockSlotId() : null)
                .slotNumber(slot != null ? slot.getSlotNumber() : null)

                .batteryId(battery.getBatteryId())
                .status(battery.getBatteryStatus().name())
                .batteryType(battery.getBatteryType().name())
                .currentCapacity(battery.getCurrentCapacity())
                .stateOfHealth(battery.getStateOfHealth())
                .cycleCount(battery.getCycleCount())
                .manufactureDate(battery.getManufactureDate())
                .expiryDate(battery.getExpiryDate())
                .isActive(battery.isActive())

                .swapCount(swapCount)
                .build();
    }


}
