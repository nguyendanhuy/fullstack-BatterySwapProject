package BatterySwapStation.service;

import BatterySwapStation.dto.DockBatteryGroupDTO;
import BatterySwapStation.dto.SlotBatteryDTO;
import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.DockSlot;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.DockSlotRepository;
import BatterySwapStation.repository.StationRepository;
import BatterySwapStation.utils.GeoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;
    private final VehicleService vehicleService; // 👈 thêm inject service này để lấy loại pin user
    private final BatteryRepository batteryRepository;
    private final DockSlotRepository DockSlotRepository;
    // ⚡ Lấy toàn bộ trạm với tổng hợp nhanh
    public List<StationResponseDTO> getAllStations() {
        List<Object[]> main = stationRepository.getStationSummary();
        Map<Integer, List<Object[]>> typeMap = stationRepository.getStationBatteryTypes()
                .stream()
                .collect(Collectors.groupingBy(o -> (Integer) o[0]));

        List<StationResponseDTO> result = new ArrayList<>();

        for (Object[] row : main) {
            Integer id = (Integer) row[0];
            String name = (String) row[1];
            String address = (String) row[2];
            var lat = (java.math.BigDecimal) row[3];
            var lon = (java.math.BigDecimal) row[4];
            boolean isActive = (boolean) row[5];
            int available = ((Number) Optional.ofNullable(row[6]).orElse(0)).intValue();
            int charging = ((Number) Optional.ofNullable(row[7]).orElse(0)).intValue();
            int total = ((Number) Optional.ofNullable(row[8]).orElse(0)).intValue();

            // nhóm theo loại pin
            List<StationResponseDTO.BatteryTypeRow> batteryRows =
                    typeMap.getOrDefault(id, List.of()).stream()
                            .filter(o -> o[1] != null)
                            .map(o -> new StationResponseDTO.BatteryTypeRow(
                                    String.valueOf(o[1]),
                                    ((Number) Optional.ofNullable(o[2]).orElse(0)).intValue(),
                                    ((Number) Optional.ofNullable(o[3]).orElse(0)).intValue()
                            ))
                            .filter(bt -> bt.getTotal() > 0)
                            .toList();

            result.add(StationResponseDTO.builder()
                    .stationId(id)
                    .stationName(name)
                    .address(address)
                    .latitude(lat)
                    .longitude(lon)
                    .isActive(isActive)
                    .availableCount(available)
                    .chargingCount(charging)
                    .totalBatteries(total)
                    .batteries(batteryRows)
                    .build());
        }
        return result;
    }

    // ⚡ Lấy chi tiết 1 trạm
    public StationResponseDTO getStationDetail(int id) {
        return getAllStations().stream()
                .filter(s -> Objects.equals(s.getStationId(), id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm với mã: " + id));
    }

    // ⚡ API /nearby – lọc trong bán kính, không sort theo khoảng cách
    public List<StationResponseDTO> getNearbyStations(double lat, double lng, double radiusKm) {
        final double radius = radiusKm <= 0 ? 50 : radiusKm;
        return getAllStations().stream()
                .filter(st -> {
                    double distance = GeoUtils.haversineKm(
                            lat, lng,
                            st.getLatitude().doubleValue(),
                            st.getLongitude().doubleValue()
                    );
                    return distance <= radius;
                })
                .toList();
    }

    // ⚡ API /stations/user – Ưu tiên trạm có loại pin trùng với xe user
    public List<StationResponseDTO> getAllStationsPrioritizedByUserBattery(String userId) {
        List<StationResponseDTO> stations = getAllStations();

        // 🔹 Lấy danh sách loại pin mà user đang sở hữu
        Set<Vehicle.BatteryType> userBatteryTypes = vehicleService.getActiveUserVehicles(userId).stream()
                .filter(Vehicle::isActive)
                .map(Vehicle::getBatteryType)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (userBatteryTypes.isEmpty()) {
            // Nếu user chưa có xe, trả về danh sách gốc
            return stations;
        }

        // 🔹 Sort: trạm có pin trùng loại user lên đầu
        stations.sort((s1, s2) -> {
            boolean s1Match = hasMatchingBatteryType(s1, userBatteryTypes);
            boolean s2Match = hasMatchingBatteryType(s2, userBatteryTypes);
            return Boolean.compare(s2Match, s1Match); // true trước (match > non-match)
        });

        return stations;
    }

    // ✅ Helper: kiểm tra trạm có loại pin trùng với user không
    private boolean hasMatchingBatteryType(StationResponseDTO station, Set<Vehicle.BatteryType> userBatteryTypes) {
        if (station.getBatteries() == null || station.getBatteries().isEmpty()) return false;
        for (StationResponseDTO.BatteryTypeRow bt : station.getBatteries()) {
            try {
                Vehicle.BatteryType type = Vehicle.BatteryType.valueOf(bt.getBatteryType());
                if (userBatteryTypes.contains(type)) {
                    return true;
                }
            } catch (IllegalArgumentException ignored) {
                // bỏ qua nếu enum không hợp lệ
            }
        }
        return false;
    }

    public List<Battery> getAllLooseBatteries(Integer stationId) {
        return batteryRepository.findAllLooseBatteriesByStation(stationId);
    }


    public List<DockBatteryGroupDTO> getGroupedBatteriesFull(Integer stationId) {
        List<DockSlot> slots = DockSlotRepository.findAllByDock_Station_StationId(stationId);

        Map<String, List<DockSlot>> grouped = slots.stream()
                .collect(Collectors.groupingBy(s -> s.getDock().getDockName()));

        List<DockBatteryGroupDTO> result = new ArrayList<>();

        for (var entry : grouped.entrySet()) {
            String dockName = entry.getKey();
            List<DockSlot> dockSlots = entry.getValue();
            dockSlots.sort(Comparator.comparing(DockSlot::getSlotNumber));

            List<SlotBatteryDTO> slotDtos = new ArrayList<>();
            for (DockSlot slot : dockSlots) {
                SlotBatteryDTO dto = new SlotBatteryDTO();
                dto.setSlotId(slot.getDockSlotId());
                dto.setSlotNumber(slot.getSlotNumber());
                dto.setSlotCode(dockName + slot.getSlotNumber());

                if (slot.getBattery() != null) {
                    var b = slot.getBattery();
                    dto.setBatteryId(b.getBatteryId());
                    dto.setBatteryType(b.getBatteryType().name());
                    dto.setBatteryStatus(b.getBatteryStatus().name());
                    dto.setCurrentCapacity(b.getCurrentCapacity());
                    dto.setStateOfHealth(b.getStateOfHealth());
                } else {
                    dto.setBatteryStatus("EMPTY");
                    dto.setCurrentCapacity(0.0);
                }

                slotDtos.add(dto);
            }

            DockBatteryGroupDTO dockDto = new DockBatteryGroupDTO();
            dockDto.setDockName(dockName);
            dockDto.setSlots(slotDtos);
            result.add(dockDto);
        }

        // Pin không thuộc dock
        var loose = getAllLooseBatteries(stationId);
        if (!loose.isEmpty()) {
            DockBatteryGroupDTO extra = new DockBatteryGroupDTO();
            extra.setDockName("NO_DOCK");
            extra.setSlots(loose.stream().map(b -> {
                SlotBatteryDTO dto = new SlotBatteryDTO();
                dto.setBatteryId(b.getBatteryId());
                dto.setBatteryType(b.getBatteryType().name());
                dto.setBatteryStatus(b.getBatteryStatus().name());
                dto.setCurrentCapacity(b.getCurrentCapacity());
                dto.setStateOfHealth(b.getStateOfHealth());
                dto.setSlotCode("UNASSIGNED");
                dto.setSlotNumber(0);
                return dto;
            }).toList());
            result.add(extra);
        }

        result.sort(Comparator.comparing(DockBatteryGroupDTO::getDockName));
        return result;
    }

    public List<DockBatteryGroupDTO> getGroupedBatteriesOnly(Integer stationId) {
        List<DockSlot> slots = DockSlotRepository.findAllByDock_Station_StationId(stationId);

        Map<String, List<DockSlot>> grouped = slots.stream()
                .collect(Collectors.groupingBy(s -> s.getDock().getDockName()));

        List<DockBatteryGroupDTO> result = new ArrayList<>();

        for (var entry : grouped.entrySet()) {
            String dockName = entry.getKey();
            List<DockSlot> dockSlots = entry.getValue();
            dockSlots.sort(Comparator.comparing(DockSlot::getSlotNumber));

            List<SlotBatteryDTO> slotDtos = new ArrayList<>();
            for (DockSlot slot : dockSlots) {
                SlotBatteryDTO dto = new SlotBatteryDTO();
                dto.setSlotId(slot.getDockSlotId());
                dto.setSlotNumber(slot.getSlotNumber());
                dto.setSlotCode(dockName + slot.getSlotNumber());

                if (slot.getBattery() != null) {
                    var b = slot.getBattery();
                    dto.setBatteryId(b.getBatteryId());
                    dto.setBatteryType(b.getBatteryType().name());
                    dto.setBatteryStatus(b.getBatteryStatus().name());
                    dto.setCurrentCapacity(b.getCurrentCapacity());
                    dto.setStateOfHealth(b.getStateOfHealth());
                } else {
                    dto.setBatteryStatus("EMPTY");
                    dto.setCurrentCapacity(0.0);
                }
                slotDtos.add(dto);
            }

            DockBatteryGroupDTO dockDto = new DockBatteryGroupDTO();
            dockDto.setDockName(dockName);
            dockDto.setSlots(slotDtos);
            result.add(dockDto);
        }

        result.sort(Comparator.comparing(DockBatteryGroupDTO::getDockName));
        return result;
    }

}