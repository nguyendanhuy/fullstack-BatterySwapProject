package BatterySwapStation.repository;

import BatterySwapStation.entity.DisputeTicket; // ✅ [SỬA LỖI] Đổi từ BatteryInspection
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // ✅ Thêm @Repository

@Repository // ✅ Thêm annotation này
public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, Long> { // ✅ [SỬA LỖI] Đổi từ BatteryInspection
    // (Tạm thời không cần thêm gì vào đây)
}