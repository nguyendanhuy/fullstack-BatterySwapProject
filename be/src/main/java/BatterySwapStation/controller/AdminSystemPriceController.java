package BatterySwapStation.controller;

import BatterySwapStation.dto.SystemPriceUpdateRequest;
import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.service.SystemPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin/system-prices")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')") // TODO: Bật lại khi deploy production
public class AdminSystemPriceController {

    private final SystemPriceService systemPriceService;

    @GetMapping
    public ResponseEntity<List<SystemPrice>> getAllSystemPrices() {
        List<SystemPrice> prices = systemPriceService.getAllPrices();
        return ResponseEntity.ok(prices);
    }

    @GetMapping("/{priceType}")
    public ResponseEntity<SystemPrice> getSystemPriceByType(
            @PathVariable SystemPrice.PriceType priceType) {
        SystemPrice price = systemPriceService.getSystemPriceByType(priceType);
        return ResponseEntity.ok(price);
    }

    @PutMapping("/{priceType}")
    public ResponseEntity<SystemPrice> updateSystemPrice(
            @PathVariable SystemPrice.PriceType priceType,
            @Valid @RequestBody SystemPriceUpdateRequest request) {
        SystemPrice updated = systemPriceService.updatePrice(
                priceType,
                request.getPrice(),
                request.getDescription()
        );
        return ResponseEntity.ok(updated);
    }
}