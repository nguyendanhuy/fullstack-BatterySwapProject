package BatterySwapStation.service;

import BatterySwapStation.dto.BatteryDetail;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatteryService {

    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;
    private final BatterySocketController batterySocketController;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SwapRepository swapRepository;
    // ==================== TỰ ĐỘNG SẠC ====================
    @Scheduled(fixedRate = 6000) // mỗi 6 giây
    @Transactional
    public void autoChargeBatteries() {
        List<Battery> chargingBatteries = batteryRepository.findByBatteryStatus(Battery.BatteryStatus.CHARGING);
        if (chargingBatteries.isEmpty()) return;

        List<Battery> updated = new ArrayList<>();

        for (Battery battery : chargingBatteries) {
            double current = Optional.ofNullable(battery.getCurrentCapacity()).orElse(0.0);
            current += 10.0;
            if (current > 100.0) current = 100.0;

            boolean fullyCharged = current >= 100.0;
            battery.setCurrentCapacity(current);

            if (fullyCharged) {
                battery.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            }

            updated.add(battery);

            // ✅ Luôn gửi realtime mỗi lần tăng (dù nhiều pin)
            if (battery.getDockSlot() != null) {
                DockSlot slot = battery.getDockSlot();
                String action = fullyCharged ? "CHARGING_COMPLETE" : "CHARGING_PROGRESS";
                sendRealtimeUpdate(slot, action, battery.getBatteryStatus().name(), battery);
            }
        }

        // ✅ Batch update tất cả pin sau cùng
        batteryRepository.saveAll(updated);
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

        return list.stream().map(battery -> {
            Map<String, Object> result = new HashMap<>();

            DockSlot slot = battery.getDockSlot();

            Integer lastBookingId = swapRepository
                    .findLatestBookingIdByBattery(battery.getBatteryId())
                    .stream()
                    .findFirst()
                    .orElse(null);

            result.put("batteryId", battery.getBatteryId());
            result.put("batteryType", battery.getBatteryType());
            result.put("stateOfHealth", battery.getStateOfHealth());
            result.put("cycleCount", battery.getCycleCount()); //Thêm cycleCount
            result.put("lastBookingId", lastBookingId); //  Thêm booking mới nhất

            if (slot != null && slot.getDock() != null) {
                result.put("dockName", slot.getDock().getDockName());
                result.put("slotNumber", slot.getSlotNumber());
            } else {
                result.put("dockName", null);
                result.put("slotNumber", null);
            }

            return result;
        }).toList();
    }



    // ==================== PIN RỜI TRONG TRẠM (KHÔNG TRONG DOCKSLOT) ====================
    @Transactional
    public List<Map<String, Object>> getLooseBatteriesByStation(Integer stationId) {
        List<Object[]> list = batteryRepository.findLooseBatteriesFastByStation(stationId);

        return list.stream()
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("batteryId", r[0]);
                    map.put("batteryType", r[1]);
                    map.put("batteryStatus", r[2]);
                    map.put("stateOfHealth", r[3]);
                    map.put("currentCapacity", r[4]);
                    map.put("stationId", r[5]);
                    return map;
                })
                .toList();
    }




    public BatteryDetail getBatteryDetail(String batteryId) {
        Battery battery = batteryRepository.findById(batteryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin: " + batteryId));

        long swapCount = swapRepository.countSwapsByBattery(batteryId);

        DockSlot slot = battery.getDockSlot();

        return BatteryDetail.builder()
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
    @Transactional
    public Map<String, Object> getBatteryStatistics() {
        List<Battery> all = batteryRepository.findAll();

        long total = all.size();

        // ✅ Thống kê theo loại pin
        Map<String, Long> byType = all.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getBatteryType().name(),
                        Collectors.counting()
                ));

        // ✅ Thống kê theo station
        Map<Integer, Long> byStation = all.stream()
                .filter(b -> b.getStationId() != null)
                .collect(Collectors.groupingBy(Battery::getStationId, Collectors.counting()));

        // ✅ Pin không thuộc trạm nào
        long unassigned = all.stream()
                .filter(b -> b.getStationId() == null)
                .count();

        return Map.of(
                "totalBatteries", total,
                "byType", byType,
                "byStation", byStation,
                "unassigned", unassigned
        );
    }

    @Transactional()
    public Map<Integer, List<Map<String, Object>>> getAllLooseBatteriesGroupedByStation() {
        List<Object[]> rows = batteryRepository.findLooseBatteriesWithStationFast();

        Map<Integer, List<Map<String, Object>>> result = new HashMap<>();

        for (Object[] r : rows) {
            Integer stationId = (Integer) r[5];
            Map<String, Object> map = new HashMap<>();
            map.put("batteryId", r[0]);
            map.put("batteryType", r[1]);
            map.put("batteryStatus", r[2]);
            map.put("stateOfHealth", r[3]);
            map.put("currentCapacity", r[4]);
            map.put("stationId", stationId);

            result.computeIfAbsent(stationId, k -> new ArrayList<>()).add(map);
        }
        return result;
    }

    @Transactional
    public List<Battery> getRandomUnassignedBatteriesByType(Battery.BatteryType type) {
        return batteryRepository.findRandomUnassignedBatteriesByType(type, PageRequest.of(0, 10));
    }


}
