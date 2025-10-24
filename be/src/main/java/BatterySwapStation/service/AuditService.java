package BatterySwapStation.service;

import BatterySwapStation.dto.AuditIssueDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Map<String, Object> checkDataDiscrepancy(Integer stationFilter, boolean pushRealtime) {

        // 🔹 Load toàn bộ dữ liệu chỉ bằng 2 query nhờ @EntityGraph
        List<Battery> allBatteries = (stationFilter == null)
                ? batteryRepository.findAll()
                : batteryRepository.findByStationId(stationFilter);

        List<DockSlot> allSlots = (stationFilter == null)
                ? dockSlotRepository.findAll()
                : dockSlotRepository.findAllByDock_Station_StationId(stationFilter);

        List<AuditIssueDTO> issues = new ArrayList<>();
        String now = LocalDateTime.now().toString();

        // ✅ 1. Pin có stationId nhưng không nằm trong slot
        for (Battery b : allBatteries) {
            boolean needsSlot = switch (b.getBatteryStatus()) {
                case AVAILABLE, CHARGING, WAITING_CHARGE -> true;
                default -> false;
            };
            if (b.getStationId() != null && b.getDockSlot() == null && needsSlot) {
                issues.add(AuditIssueDTO.builder()
                        .batteryId(b.getBatteryId())
                        .stationId(b.getStationId())
                        .issueType("BATTERY_NO_SLOT")
                        .description("Pin có stationId nhưng không nằm trong slot.")
                        .note("Kiểm tra lại slot trống trong trạm và gán đúng dockSlot.")
                        .detectedAt(now)
                        .build());
            }
        }

        // ✅ 2. Slot có pin nhưng battery không tham chiếu ngược lại
        for (DockSlot s : allSlots) {
            if (s.getBattery() != null) {
                Battery b = s.getBattery();
                if (b.getDockSlot() == null || !Objects.equals(b.getDockSlot().getDockSlotId(), s.getDockSlotId())) {
                    issues.add(AuditIssueDTO.builder()
                            .batteryId(b.getBatteryId())
                            .stationId(s.getDock().getStation().getStationId())
                            .dockName(s.getDock().getDockName())
                            .slotNumber(s.getSlotNumber())
                            .issueType("SLOT_UNSYNC_BATTERY")
                            .description("Slot chứa pin nhưng battery không tham chiếu ngược lại slot.")
                            .note("Đồng bộ lại b.dockSlot = slot hiện tại.")
                            .detectedAt(now)
                            .build());
                }
            }
        }

        // ✅ 3. Pin CHARGING/WAITING_CHARGE nhưng không ở slot nào
        for (Battery b : allBatteries) {
            if (b.getDockSlot() == null &&
                    (b.getBatteryStatus() == Battery.BatteryStatus.CHARGING ||
                            b.getBatteryStatus() == Battery.BatteryStatus.WAITING_CHARGE)) {
                issues.add(AuditIssueDTO.builder()
                        .batteryId(b.getBatteryId())
                        .stationId(b.getStationId())
                        .issueType("STATE_MISMATCH")
                        .description("Pin đang CHARGING/WAITING_CHARGE nhưng không nằm trong slot nào.")
                        .note("Cập nhật trạng thái phù hợp hoặc gán vào slot OCCUPIED.")
                        .detectedAt(now)
                        .build());
            }
        }

        // ✅ 4. Pin và slot khác station
        for (Battery b : allBatteries) {
            if (b.getDockSlot() != null) {
                Integer slotStationId = b.getDockSlot().getDock().getStation().getStationId();
                if (b.getStationId() != null && !b.getStationId().equals(slotStationId)) {
                    issues.add(AuditIssueDTO.builder()
                            .batteryId(b.getBatteryId())
                            .stationId(b.getStationId())
                            .dockName(b.getDockSlot().getDock().getDockName())
                            .slotNumber(b.getDockSlot().getSlotNumber())
                            .issueType("STATION_MISMATCH")
                            .description("Pin và slot thuộc hai station khác nhau.")
                            .note("Đồng bộ b.stationId = station của slot.")
                            .detectedAt(now)
                            .build());
                }
            }
        }

        // 5. Slot trạng thái không khớp
        for (DockSlot s : allSlots) {
            Battery b = s.getBattery();
            switch (s.getSlotStatus()) {
                case EMPTY -> {
                    if (b != null) {
                        issues.add(AuditIssueDTO.builder()
                                .batteryId(b.getBatteryId())
                                .stationId(s.getDock().getStation().getStationId())
                                .dockName(s.getDock().getDockName())
                                .slotNumber(s.getSlotNumber())
                                .issueType("STATE_MISMATCH")
                                .description("Slot EMPTY nhưng lại có battery gắn.")
                                .note("Chuyển slot sang OCCUPIED hoặc bỏ battery khỏi slot.")
                                .detectedAt(now)
                                .build());
                    }
                }
                case OCCUPIED -> {
                    if (b == null) {
                        issues.add(AuditIssueDTO.builder()
                                .batteryId(null)
                                .stationId(s.getDock().getStation().getStationId())
                                .dockName(s.getDock().getDockName())
                                .slotNumber(s.getSlotNumber())
                                .issueType("ORPHAN_SLOT")
                                .description("Slot OCCUPIED nhưng không có battery gắn.")
                                .note("Chuyển slot sang EMPTY hoặc gắn battery đúng vào slot.")
                                .detectedAt(now)
                                .build());
                    }
                }
                default -> {}
            }
        }

        // ✅ Tổng hợp kết quả
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", now);
        response.put("stationFilter", stationFilter);
        response.put("totalBatteries", allBatteries.size());
        response.put("totalSlots", allSlots.size());
        response.put("totalIssues", issues.size());
        response.put("summary", issues.stream()
                .collect(Collectors.groupingBy(AuditIssueDTO::getIssueType, Collectors.counting())));
        response.put("issues", issues);

        // ✅ Push realtime nếu cần
        if (pushRealtime && !issues.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/admin-audit", response);
        }

        return response;
    }
}
