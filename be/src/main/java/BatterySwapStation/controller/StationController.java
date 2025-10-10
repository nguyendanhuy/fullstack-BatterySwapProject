package BatterySwapStation.controller;

import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@PreAuthorize("permitAll()")
@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

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



}