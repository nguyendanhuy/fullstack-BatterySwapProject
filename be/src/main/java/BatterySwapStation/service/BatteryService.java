package BatterySwapStation.service;

import BatterySwapStation.dto.BatteryRealtimeEvent;
import BatterySwapStation.dto.BatteryStatusUpdateRequest;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BatteryService {

    private final BatteryRepository batteryRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    private final DockSlotRepository dockSlotRepository;

    // ==================== TỰ ĐỘNG SẠC ====================
    @Scheduled(fixedRate = 60000) // 1 phút
    @Transactional
    public void autoChargeBatteries() {
        List<Battery> chargingBatteries = batteryRepository.findByBatteryStatus(Battery.BatteryStatus.CHARGING);

        for (Battery battery : chargingBatteries) {
            double current = battery.getCurrentCapacity() == null ? 0.0 : battery.getCurrentCapacity();
            current += 10.0; // tăng 10% mỗi phút

            if (current >= 100.0) {
                current = 100.0;
                battery.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            }

            battery.setCurrentCapacity(current);
            batteryRepository.save(battery);
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

        // Cập nhật DB
        slot.setBattery(null);
        slot.setSlotStatus(DockSlot.SlotStatus.EMPTY);
        dockSlotRepository.save(slot);

        battery.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        battery.setDockSlot(null);
        battery.setStationId(null);
        batteryRepository.save(battery);

        // Gửi realtime
        sendRealtimeUpdate(slot, "EJECTED", "EMPTY", battery);

        String msg = String.format(
                "Pin %s đã được rút khỏi Dock %s Slot %d (Station %d).",
                batteryId, dock.getDockName(), slot.getSlotNumber(), station.getStationId()
        );

        return Map.of(
                "batteryId", batteryId,
                "stationId", station.getStationId(),
                "dockName", dock.getDockName(),
                "slotNumber", slot.getSlotNumber(),
                "batteryStatus", "EMPTY",
                "action", "EJECTED",
                "message", msg
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

        // Cập nhật DB
        slot.setBattery(battery);
        slot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        dockSlotRepository.save(slot);

        // ✅ trạng thái CHỜ SẠC thay vì CHARGING
        battery.setBatteryStatus(Battery.BatteryStatus.WAITING_CHARGE);
        battery.setStationId(station.getStationId());
        battery.setDockSlot(slot);
        batteryRepository.save(battery);

        // Gửi realtime
        sendRealtimeUpdate(slot, "INSERTED", "WAITING_CHARGE", battery);

        String msg = String.format(
                "Pin %s đã được đút vào Dock %s Slot %d (Station %d), đang chờ sạc.",
                batteryId, dock.getDockName(), slot.getSlotNumber(), station.getStationId()
        );

        return Map.of(
                "batteryId", batteryId,
                "stationId", station.getStationId(),
                "dockName", dock.getDockName(),
                "slotNumber", slot.getSlotNumber(),
                "batteryStatus", "WAITING_CHARGE",
                "action", "INSERTED",
                "message", msg
        );
    }



    @Transactional
    public Map<String, Object> updateBatteryStatus(BatteryStatusUpdateRequest req) {
        Battery battery = batteryRepository.findById(req.getBatteryId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy pin " + req.getBatteryId()));

        battery.setBatteryStatus(req.getNewStatus());
        batteryRepository.save(battery);

        // 🔹 Gửi realtime nếu pin đang thuộc 1 station hoặc có slot
        if (battery.getDockSlot() != null) {
            DockSlot slot = battery.getDockSlot();
            sendRealtimeUpdate(slot, "STATUS_CHANGED", req.getNewStatus().name(), battery);
        }

        return Map.of(
                "batteryId", battery.getBatteryId(),
                "newStatus", battery.getBatteryStatus(),
                "message", "Cập nhật trạng thái pin thành công"
        );
    }




    // ==================== GỬI REALTIME ====================
    private void sendRealtimeUpdate(DockSlot slot, String action, String status, Battery battery) {
        BatteryRealtimeEvent event = BatteryRealtimeEvent.builder()
                .stationId(slot.getDock().getStation().getStationId())
                .dockName(slot.getDock().getDockName())
                .slotNumber(slot.getSlotNumber())
                .batteryId(battery != null ? battery.getBatteryId() : null)
                .batteryStatus(status)
                .stateOfHealth(battery != null ? battery.getStateOfHealth() : null)
                .currentCapacity(battery != null ? battery.getCurrentCapacity() : null)
                .action(action)
                .timestamp(LocalDateTime.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/station-" + event.getStationId(), event);
    }



}
