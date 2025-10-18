package BatterySwapStation.controller;

import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.service.SystemPriceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/system-price")
@RequiredArgsConstructor
@Tag(name = "System Price Management", description = "APIs quản lý giá hệ thống - quy luật chung cho toàn dự án")
public class SystemPriceController {

    private final SystemPriceService systemPriceService;

    @GetMapping("/current")
    @Operation(summary = "Lấy giá hiện tại", description = "Lấy giá hiện tại của hệ thống (áp dụng cho tất cả loại pin)")
    public ResponseEntity<Map<String, Object>> getCurrentPrice() {
        try {
            Double currentPrice = systemPriceService.getCurrentPrice();
            String priceInfo = systemPriceService.getCurrentPriceInfo();
            boolean isDefault = systemPriceService.isUsingDefaultPrice();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "price", currentPrice,
                "description", priceInfo,
                "isDefault", isDefault,
                "message", "Giá áp dụng cho tất cả loại pin và lượt đổi pin"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi lấy giá hiện tại",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/update")
    @Operation(summary = "Cập nhật giá hệ thống", description = "Cập nhật giá mới cho toàn hệ thống")
    public ResponseEntity<Map<String, Object>> updateSystemPrice(@RequestBody UpdatePriceRequest request) {
        try {
            SystemPrice updatedPrice = systemPriceService.updateSystemPrice(
                request.getPrice(),
                request.getDescription()
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cập nhật giá hệ thống thành công",
                "systemPrice", Map.of(
                    "id", updatedPrice.getId(),
                    "price", updatedPrice.getSafePrice(),
                    "description", updatedPrice.getDescription(),
                    "createdDate", updatedPrice.getCreatedDate()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi cập nhật giá hệ thống",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/initialize")
    @Operation(summary = "Khởi tạo giá mặc định", description = "Khởi tạo giá mặc định 15,000 VND cho hệ thống")
    public ResponseEntity<Map<String, Object>> initializeDefaultPrice() {
        try {
            SystemPrice defaultPrice = systemPriceService.initializeDefaultPrice();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Khởi tạo giá mặc định thành công",
                "systemPrice", defaultPrice != null ? Map.of(
                    "id", defaultPrice.getId(),
                    "price", defaultPrice.getSafePrice(),
                    "description", defaultPrice.getDescription(),
                    "createdDate", defaultPrice.getCreatedDate()
                ) : null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi khởi tạo giá mặc định",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset về giá mặc định", description = "Reset giá hệ thống về 15,000 VND")
    public ResponseEntity<Map<String, Object>> resetToDefaultPrice() {
        try {
            SystemPrice resetPrice = systemPriceService.resetToDefaultPrice();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reset giá về mặc định thành công",
                "systemPrice", Map.of(
                    "id", resetPrice.getId(),
                    "price", resetPrice.getSafePrice(),
                    "description", resetPrice.getDescription(),
                    "createdDate", resetPrice.getCreatedDate()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi reset giá",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/info")
    @Operation(summary = "Lấy thông tin chi tiết", description = "Lấy thông tin chi tiết về giá hệ thống")
    public ResponseEntity<Map<String, Object>> getSystemPriceInfo() {
        try {
            String priceInfo = systemPriceService.getCurrentPriceInfo();
            Double currentPrice = systemPriceService.getCurrentPrice();
            boolean isDefault = systemPriceService.isUsingDefaultPrice();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "currentPrice", currentPrice,
                "priceInfo", priceInfo,
                "isUsingDefaultPrice", isDefault,
                "defaultPrice", 15000.0,
                "applicableFor", "Tất cả loại pin và lượt đổi pin",
                "systemRule", "Giá thống nhất cho toàn dự án"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi lấy thông tin giá",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/calculate")
    @Operation(summary = "Tính tổng tiền", description = "Tính tổng tiền dựa trên số lượng lượt đổi pin")
    public ResponseEntity<Map<String, Object>> calculateTotalAmount(
            @RequestParam Integer quantity) {
        try {
            if (quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Số lượng phải lớn hơn 0"
                ));
            }

            Double currentPrice = systemPriceService.getCurrentPrice();
            Double totalAmount = currentPrice * quantity;

            return ResponseEntity.ok(Map.of(
                "success", true,
                "quantity", quantity,
                "pricePerSwap", currentPrice,
                "totalAmount", totalAmount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi tính tổng tiền"
            ));
        }
    }

    @PostMapping("/calculate")
    @Operation(summary = "Tính tổng tiền (POST)", description = "Tính tổng tiền dựa trên số lượng lượt đổi pin")
    public ResponseEntity<Map<String, Object>> calculateTotalAmountPost(@RequestBody CalculateRequest request) {
        try {
            if (request.getQuantity() == null || request.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Số lượng phải lớn hơn 0"
                ));
            }

            Double currentPrice = systemPriceService.getCurrentPrice();
            Double totalAmount = currentPrice * request.getQuantity();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "quantity", request.getQuantity(),
                "pricePerSwap", currentPrice,
                "totalAmount", totalAmount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi khi tính tổng tiền"
            ));
        }
    }

    // DTO cho request
    public static class UpdatePriceRequest {
        private Double price;
        private String description;

        // Constructors
        public UpdatePriceRequest() {}

        public UpdatePriceRequest(Double price, String description) {
            this.price = price;
            this.description = description;
        }

        // Getters and setters
        public Double getPrice() {
            return price != null ? price : 15000.0;
        }

        public void setPrice(Double price) {
            this.price = price;
        }

        public String getDescription() {
            return description != null ? description : "Cập nhật giá hệ thống";
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    // DTO cho calculate request
    public static class CalculateRequest {
        private Integer quantity;
        private String description;

        // Constructors
        public CalculateRequest() {}

        public CalculateRequest(Integer quantity, String description) {
            this.quantity = quantity;
            this.description = description;
        }

        // Getters and setters
        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
