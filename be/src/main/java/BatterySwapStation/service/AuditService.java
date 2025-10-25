package BatterySwapStation.service;

import BatterySwapStation.dto.AuditIssueDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import BatterySwapStation.websocket.BatteryWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;
    private final BatteryWebSocketHandler batteryWebSocketHandler;

    @Transactional
    public Map<String, Object> checkDataDiscrepancy(Integer stationFilter, boolean pushRealtime) {

        List<Battery> allBatteries = (stationFilter == null)
                ? batteryRepository.findAll()
                : batteryRepository.findByStationId(stationFilter);

        List<DockSlot> allSlots = (stationFilter == null)
                ? dockSlotRepository.findAll()
                : dockSlotRepository.findAllByDock_Station_StationId(stationFilter);

        List<AuditIssueDTO> issues = new ArrayList<>();
        String now = LocalDateTime.now().toString();

        // ⚙️ Toàn bộ logic check giữ nguyên như cũ...

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", now);
        response.put("stationFilter", stationFilter);
        response.put("totalBatteries", allBatteries.size());
        response.put("totalSlots", allSlots.size());
        response.put("totalIssues", issues.size());
        response.put("summary", issues.stream()
                .collect(Collectors.groupingBy(AuditIssueDTO::getIssueType, Collectors.counting())));
        response.put("issues", issues);

        // 🟢 Gửi realtime qua raw WebSocket
        if (pushRealtime && !issues.isEmpty()) {
            try {
                String json = new ObjectMapper().writeValueAsString(response);
                batteryWebSocketHandler.broadcastToStation(stationFilter, json);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return response;
    }
}
