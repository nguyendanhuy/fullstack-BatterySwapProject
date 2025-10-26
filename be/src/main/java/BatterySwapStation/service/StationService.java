package BatterySwapStation.service;

import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.repository.BatteryRepository;
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

}