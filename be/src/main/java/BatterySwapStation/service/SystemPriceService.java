package BatterySwapStation.service;

import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.repository.SystemPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemPriceService {

    private final SystemPriceRepository systemPriceRepository;

    // Giá mặc định fallback cho toàn hệ thống
    private static final Double DEFAULT_PRICE = 15000.0;

    /**
     * Lấy giá hiện tại của hệ thống (duy nhất 1 giá cho tất cả)
     */
    @Transactional(readOnly = true)
    public Double getCurrentPrice() {
        try {
            return systemPriceRepository.findCurrentSystemPrice()
                    .map(SystemPrice::getSafePrice)
                    .orElse(DEFAULT_PRICE);
        } catch (Exception e) {
            log.error("Lỗi khi lấy giá hệ thống", e);
            return DEFAULT_PRICE;
        }
    }

    /**
     * Lấy giá cho bất kỳ loại pin nào (tất cả đều dùng chung 1 giá)
     */
    @Transactional(readOnly = true)
    public Double getCurrentPrice(String batteryType) {
        // Bỏ qua batteryType vì giờ tất cả đều dùng chung 1 giá
        return getCurrentPrice();
    }

    /**
     * Lấy SystemPrice object hiện tại
     */
    @Transactional(readOnly = true)
    public Optional<SystemPrice> getCurrentSystemPrice() {
        return systemPriceRepository.findCurrentSystemPrice();
    }

    /**
     * Cập nhật giá hệ thống (tạo mới hoặc update)
     */
    public SystemPrice updateSystemPrice(Double newPrice, String description) {
        try {
            SystemPrice systemPrice = new SystemPrice(newPrice, description);
            SystemPrice saved = systemPriceRepository.save(systemPrice);

            log.info("Đã cập nhật giá hệ thống thành: {} VND", newPrice);
            return saved;
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật giá hệ thống", e);
            throw new RuntimeException("Không thể cập nhật giá hệ thống: " + e.getMessage());
        }
    }

    /**
     * Khởi tạo giá mặc định cho hệ thống lần đầu
     */
    public SystemPrice initializeDefaultPrice() {
        try {
            // Kiểm tra đã có giá chưa
            if (!systemPriceRepository.existsBy()) {
                SystemPrice defaultPrice = new SystemPrice(
                    DEFAULT_PRICE,
                    "Giá mặc định khởi tạo hệ thống - áp dụng cho tất cả loại pin"
                );

                SystemPrice saved = systemPriceRepository.save(defaultPrice);
                log.info("Đã khởi tạo giá mặc định hệ thống: {} VND", DEFAULT_PRICE);
                return saved;
            } else {
                log.info("Hệ thống đã có giá, không cần khởi tạo");
                return getCurrentSystemPrice().orElse(null);
            }
        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo giá mặc định", e);
            throw new RuntimeException("Không thể khởi tạo giá mặc định: " + e.getMessage());
        }
    }

    /**
     * Lấy thông tin giá hiện tại với description
     */
    @Transactional(readOnly = true)
    public String getCurrentPriceInfo() {
        try {
            Optional<SystemPrice> currentPrice = getCurrentSystemPrice();
            if (currentPrice.isPresent()) {
                SystemPrice price = currentPrice.get();
                return String.format("Giá hiện tại: %.0f VND - %s",
                    price.getSafePrice(),
                    price.getDescription());
            } else {
                return String.format("Giá mặc định: %.0f VND - Chưa có cấu hình", DEFAULT_PRICE);
            }
        } catch (Exception e) {
            log.error("Lỗi khi lấy thông tin giá", e);
            return String.format("Giá fallback: %.0f VND - Lỗi hệ thống", DEFAULT_PRICE);
        }
    }

    /**
     * Kiểm tra giá hiện tại có phải mặc định không
     */
    @Transactional(readOnly = true)
    public boolean isUsingDefaultPrice() {
        return getCurrentSystemPrice()
                .map(SystemPrice::isDefaultPrice)
                .orElse(true);
    }

    /**
     * Reset về giá mặc định
     */
    public SystemPrice resetToDefaultPrice() {
        return updateSystemPrice(DEFAULT_PRICE, "Reset về giá mặc định hệ thống");
    }
}
