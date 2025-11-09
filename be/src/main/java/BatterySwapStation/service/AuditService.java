package BatterySwapStation.service;

import BatterySwapStation.dto.AuditIssue;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import BatterySwapStation.websocket.BatterySocketController;
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
    private final BatterySocketController batterySocketController;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Map<String, Object> checkDataDiscrepancy(Integer stationId, boolean pushRealtime) {

        List<Battery> allBatteries = (stationId == null)
                ? batteryRepository.findAll()
                : batteryRepository.findByStationId(stationId);

        List<DockSlot> allSlots = (stationId == null)
                ? dockSlotRepository.findAll()
                : dockSlotRepository.findAllByDock_Station_StationId(stationId);

        List<AuditIssue> issues = new ArrayList<>();
        String now = LocalDateTime.now().toString();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", now);
        response.put("stationId", stationId);
        response.put("totalBatteries", allBatteries.size());
        response.put("totalSlots", allSlots.size());
        response.put("totalIssues", issues.size());
        response.put("summary", issues.stream()
                .collect(Collectors.groupingBy(AuditIssue::getIssueType, Collectors.counting())));
        response.put("issues", issues);

        if (pushRealtime && !issues.isEmpty() && stationId != null) {
            try {
                String json = objectMapper.writeValueAsString(response);
                batterySocketController.broadcastToStation(stationId, json);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return response;
    }
}
