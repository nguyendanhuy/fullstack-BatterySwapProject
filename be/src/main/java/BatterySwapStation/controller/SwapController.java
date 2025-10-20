package BatterySwapStation.controller;

import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.service.SwapService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/swaps")
@RequiredArgsConstructor
@Tag(name = "SWAP")
public class SwapController {

    private final SwapService swapService;


    @PostMapping("/commit")
    public ResponseEntity<?> commitSwap(@RequestBody SwapRequest request) {
        try {
            SwapResponseDTO response = swapService.commitSwap(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
