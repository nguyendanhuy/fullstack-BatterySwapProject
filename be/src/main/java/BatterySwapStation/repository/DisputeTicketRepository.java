package BatterySwapStation.repository;

import BatterySwapStation.entity.DisputeTicket; // ✅ [SỬA LỖI] Đổi từ BatteryInspection
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // ✅ Thêm @Repository

import java.util.List;

@Repository
public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, Long> {
    // Tìm tất cả các ticket đang MỞ hoặc ĐANG XỬ LÝ
    List<DisputeTicket> findByStatusIn(List<DisputeTicket.TicketStatus> statuses);
}