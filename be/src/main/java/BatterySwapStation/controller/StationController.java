package BatterySwapStation.controller;

import BatterySwapStation.dto.StationResponseDTO;
import BatterySwapStation.service.StationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@PreAuthorize("permitAll()")
@RestController
@RequestMapping("/api/stations")
public class StationController {

    @Autowired
    private StationService stationService;

    @GetMapping
    public List<StationResponseDTO> getAllStations() {
        return stationService.getAllStations();
    }

    @GetMapping("/{id}")
    public StationResponseDTO getStationDetail(@PathVariable int id) {
        return stationService.getStationDetail(id);
    }
}
