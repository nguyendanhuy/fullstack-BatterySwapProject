package BatterySwapStation.controller;

import BatterySwapStation.dto.DockBatteryGroupDTO;
import BatterySwapStation.dto.SlotBatteryDTO;
import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.repository.DockSlotRepository;
import BatterySwapStation.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@PreAuthorize("permitAll()")
@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;
    private final DockSlotRepository dockSlotRepository;


    @GetMapping
    public List<StationResponseDTO> getAllStations() {
        return stationService.getAllStations();
    }

    @GetMapping("/{id}")
    public StationResponseDTO getStationDetail(@PathVariable int id) {
        return stationService.getStationDetail(id);
    }

    // /api/stations/nearby?lat=10.77&lng=106.68&radiusKm=5
    @GetMapping("/nearby")
    public List<StationResponseDTO> getNearbyStations(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false, defaultValue = "50") double radiusKm) {
        return stationService.getNearbyStations(lat, lng, radiusKm);
    }




    @GetMapping("/{stationId}/batteries/grouped")
    public List<DockBatteryGroupDTO> getGroupedBatteriesByDock(@PathVariable Integer stationId) {

        // Lấy toàn bộ slot của station
        List<DockSlot> slots = dockSlotRepository.findAll()
                .stream()
                .filter(s -> s.getDock().getStation().getStationId().equals(stationId))
                .collect(Collectors.toList());

        // Group theo dock name
        Map<String, List<DockSlot>> grouped = slots.stream()
                .collect(Collectors.groupingBy(s -> s.getDock().getDockName()));

        List<DockBatteryGroupDTO> result = new ArrayList<>();

        for (var entry : grouped.entrySet()) {
            String dockName = entry.getKey();
            List<DockSlot> dockSlots = entry.getValue();

            // Sắp xếp slot theo thứ tự
            dockSlots.sort(Comparator.comparing(DockSlot::getSlotNumber));

            // Tạo map slotNumber -> DockSlot
            Map<Integer, DockSlot> slotMap = dockSlots.stream()
                    .collect(Collectors.toMap(DockSlot::getSlotNumber, s -> s));

            // Xác định số lượng slot tối đa của dock (nếu biết trước có thể cố định 10)
            int maxSlot = dockSlots.stream()
                    .mapToInt(DockSlot::getSlotNumber)
                    .max()
                    .orElse(10);

            List<SlotBatteryDTO> slotDtos = new ArrayList<>();

            // Duyệt từ 1 → maxSlot, nếu trống thì thêm EMPTY
            for (int i = 1; i <= maxSlot; i++) {
                DockSlot slot = slotMap.get(i);
                SlotBatteryDTO dto = new SlotBatteryDTO();
                dto.setSlotNumber(i);
                dto.setSlotCode(dockName + i);

                if (slot != null && slot.getBattery() != null) {
                    var b = slot.getBattery();
                    dto.setBatteryId(b.getBatteryId());
                    dto.setBatteryType(b.getBatteryType().name());
                    dto.setBatteryStatus(b.getBatteryStatus().name());
                    dto.setCurrentCapacity(b.getCurrentCapacity());
                    dto.setStateOfHealth(b.getStateOfHealth());
                } else {
                    dto.setBatteryId(null);
                    dto.setBatteryStatus("EMPTY");
                    dto.setCurrentCapacity(0.0);
                    dto.setStateOfHealth(null);
                }

                slotDtos.add(dto);
            }

            DockBatteryGroupDTO dockDto = new DockBatteryGroupDTO();
            dockDto.setDockName(dockName);
            dockDto.setSlots(slotDtos);

            result.add(dockDto);
        }

        // Sort dock theo tên (A, B, C)
        result.sort(Comparator.comparing(DockBatteryGroupDTO::getDockName));

        return result;
    }


}