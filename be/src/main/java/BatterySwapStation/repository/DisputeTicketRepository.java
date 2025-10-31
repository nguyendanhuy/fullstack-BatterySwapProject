package BatterySwapStation.repository;

import BatterySwapStation.entity.DisputeTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, Long> {
    // Tìm tất cả các ticket đang MỞ hoặc ĐANG XỬ LÝ
    List<DisputeTicket> findByStatusIn(List<DisputeTicket.TicketStatus> statuses);


     //Tìm tất cả các ticket (bất kể trạng thái) theo StationId
     //Sắp xếp theo ngày tạo mới nhất lên đầu.
    List<DisputeTicket> findByStation_StationIdOrderByCreatedAtDesc(Integer stationId);

    // Tìm tất cả các ticket được gán cho nhân viên cụ thể theo UserId của họ
    List<DisputeTicket> findByCreatedByStaff_UserId(String staffUserId);

}