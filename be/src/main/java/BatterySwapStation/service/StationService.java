package BatterySwapStation.service;

import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.entity.Station;
import BatterySwapStation.repository.StationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StationService {

    @Autowired
    private StationRepository stationRepository;

    public List<StationResponseDTO> getAllStations() {
        List<Station> stations = stationRepository.findAll();
        return stations.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public StationResponseDTO getStationDetail(int id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Station not found"));
        return mapToDTO(station);
    }

    private StationResponseDTO mapToDTO(Station station) {

        Map<String, Long> batterySummary = station.getDocks().stream()
                .flatMap(dock -> dock.getDockSlots().stream())
                .filter(slot -> slot.getBattery() != null)
                .collect(Collectors.groupingBy(
                        slot -> slot.getBattery().getBatteryStatus().toString(),
                        Collectors.counting()
                ));

        Map<String, Long> batteryTypes = station.getDocks().stream()
                .flatMap(dock -> dock.getDockSlots().stream())
                .filter(slot -> slot.getBattery() != null && slot.getBattery().getBatteryType() != null)
                .collect(Collectors.groupingBy(
                        slot -> slot.getBattery().getBatteryType().toString(),
                        Collectors.counting()
                ));

        return new StationResponseDTO(
                station.getStationId(),
                station.getStationName(),
                station.getAddress(),
                station.getLatitude(),
                station.getLongitude(),
                station.isActive(),
                batterySummary,
                batteryTypes
        );
    }
}
