package BatterySwapStation.service;

import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.repository.SystemPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException; // Dùng jakarta
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemPriceService {

    private final SystemPriceRepository systemPriceRepository;

    // 🚀 Cache SystemPrice để tránh query lặp lại
    private final Map<SystemPrice.PriceType, Double> priceCache = new ConcurrentHashMap<>();

    // [ĐÃ XÓA] - Hằng số DEFAULT_PRICE = 15000.0 đã bị xóa.
    // Giá mặc định giờ sẽ được quản lý trong database.

    /**
     * 🚀 Khởi tạo cache khi service start
     */
    @PostConstruct
    public void initPriceCache() {
        List<SystemPrice> allPrices = systemPriceRepository.findAll();
        for (SystemPrice price : allPrices) {
            priceCache.put(price.getPriceType(), price.getPrice());
        }
        log.info("✅ SystemPrice cache khởi tạo thành công với {} loại giá", priceCache.size());
    }

    /**
     * 🚀 Refresh cache (gọi sau khi update giá)
     */
    public void refreshCache() {
        priceCache.clear();
        initPriceCache();
    }

    /**
     * [THAY THẾ HÀM CŨ]
     * Lấy giá trị của một loại giá cụ thể bằng Enum.
     * 🚀 TÍCH HỢP CACHE - Không query DB nữa, chỉ đọc từ Map
     *
     * @param priceType Loại giá (ví dụ: SystemPrice.PriceType.BATTERY_SWAP)
     * @return Giá trị Double
     * @throws RuntimeException nếu không tìm thấy loại giá
     */
    @Transactional(readOnly = true)
    public Double getPriceByType(SystemPrice.PriceType priceType) {
        Double cachedPrice = priceCache.get(priceType);
        if (cachedPrice != null) {
            return cachedPrice;
        }
        // Fallback nếu cache chưa có (case edge)
        log.warn("⚠️ Cache miss cho PriceType: {}. Đang query database...", priceType);
        return systemPriceRepository.findPriceByPriceType(priceType)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình giá cho loại: " + priceType));
    }

    /**
     * [MỚI] Lấy toàn bộ đối tượng SystemPrice bằng Enum
     */
    @Transactional(readOnly = true)
    public SystemPrice getSystemPriceByType(SystemPrice.PriceType priceType) {
        return systemPriceRepository.findByPriceType(priceType)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đối tượng giá cho loại: " + priceType));
    }

    /**
     * [MỚI] Lấy tất cả các loại giá trong hệ thống
     */
    @Transactional(readOnly = true)
    public List<SystemPrice> getAllPrices() {
        return systemPriceRepository.findAll();
    }

    /**
     * [MỚI] Tạo một loại giá mới (ví dụ: cho Subscription)
     * Chỉ admin mới được dùng hàm này.
     */
    public SystemPrice createPrice(SystemPrice newPrice) {
        // Kiểm tra xem PriceType đã tồn tại chưa
        Optional<SystemPrice> existing = systemPriceRepository.findByPriceType(newPrice.getPriceType());
        if (existing.isPresent()) {
            throw new IllegalStateException("Loại giá (PriceType) '" + newPrice.getPriceType() + "' đã tồn tại.");
        }

        SystemPrice saved = systemPriceRepository.save(newPrice);
        log.info("Đã tạo loại giá mới: {} - {} VND", saved.getPriceType(), saved.getPrice());
        return saved;
    }

    /**
     * [MỚI] Cập nhật giá của một loại giá đã có
     * Chỉ admin mới được dùng hàm này.
     * 🚀 Tự động refresh cache sau khi update
     */
    public SystemPrice updatePrice(SystemPrice.PriceType priceType, Double newPrice, String newDescription) {
        SystemPrice priceToUpdate = getSystemPriceByType(priceType); // Tìm giá, nếu không thấy sẽ ném lỗi

        priceToUpdate.setPrice(newPrice);
        if (newDescription != null && !newDescription.isEmpty()) {
            priceToUpdate.setDescription(newDescription);
        }

        SystemPrice saved = systemPriceRepository.save(priceToUpdate);
        log.info("Đã cập nhật giá cho {}: {} VND", saved.getPriceType(), saved.getPrice());

        // 🚀 Refresh cache sau khi update
        refreshCache();

        return saved;
    }
}