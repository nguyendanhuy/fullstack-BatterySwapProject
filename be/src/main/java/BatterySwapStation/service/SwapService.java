package BatterySwapStation.service;

import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class SwapService {

    private final SwapRepository swapRepository;
    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;

    @Transactional
    public SwapResponseDTO commitSwap(SwapRequest request) {
        // Booking từ QR
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking ID: " + request.getBookingId()));

        if (booking.getBookingStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Booking đã hoàn thành, không thể swap lại.");
        }
        Integer stationId = booking.getStation().getStationId();

        //  Pin KH đưa (batteryIn)
        Battery batteryIn = batteryRepository.findById(request.getBatteryInId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin khách đưa: " + request.getBatteryInId()));

        //  validate battery
        if (!batteryIn.isActive()) {
            throw new IllegalStateException("Pin này đang bị vô hiệu hóa hoặc không hoạt động.");
        }

        if (batteryIn.getBatteryStatus() == Battery.BatteryStatus.MAINTENANCE) {
            throw new IllegalStateException("Pin này đang trong bảo trì, không thể swap.");
        }

        if (batteryIn.getBatteryType() == null) {
            throw new IllegalStateException("Pin chưa xác định loại, vui lòng kiểm tra lại.");
        }


        String bookedBatteryType = booking.getBatteryType();
        if (bookedBatteryType != null && !batteryIn.getBatteryType().name().equalsIgnoreCase(bookedBatteryType)) {
            throw new IllegalStateException("Pin không cùng loại với loại pin đã booking, vui lòng mang đúng loại pin.");
        }


        //  Tự chọn pin đầy khả dụng (batteryOut)
        DockSlot dockOutSlot = dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        stationId,
                        DockSlot.SlotStatus.OCCUPIED,
                        Battery.BatteryStatus.AVAILABLE
                )
                .orElseThrow(() -> new IllegalStateException("Không còn pin đầy khả dụng trong trạm."));

        Battery batteryOut = dockOutSlot.getBattery();
        if (batteryOut == null) {
            throw new IllegalStateException("Slot chứa pinOut không hợp lệ (không có pin).");
        }

        // 4️⃣ Slot chứa batteryIn (nếu pin đang nằm slot nào đó)
        Optional<DockSlot> inSlotOpt = dockSlotRepository.findByBattery_BatteryId(batteryIn.getBatteryId());
        DockSlot dockInSlot = inSlotOpt.orElse(null);

        // Nếu pinIn chưa nằm slot nào => tìm slot trống để nhận
        if (dockInSlot == null) {
            dockInSlot = dockSlotRepository
                    .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(stationId)
                    .orElse(null);
        }
        if (dockInSlot == null) {
            throw new IllegalStateException("Không còn slot trống trong trạm để nhận pinIn.");
        }

        // 5️⃣ Mã hiển thị slot: "A2", "B5"
        String dockOutCode;
        if (dockOutSlot.getDock() != null) {
            dockOutCode = dockOutSlot.getDock().getDockName() + dockOutSlot.getSlotNumber();
        } else {
            dockOutCode = "UNKNOWN" + dockOutSlot.getSlotNumber(); // fallback nếu dockOutSlot.getDock() == null
        }

        String dockInCode = dockInSlot.getDock().getDockName() + dockInSlot.getSlotNumber();

        // 6️⃣ Kiểm tra khác model => chờ user retry
        Swap.SwapStatus swapStatus = Swap.SwapStatus.SUCCESS;
        String description = "Swap hoàn tất.";

        if (!batteryIn.getBatteryType().equals(batteryOut.getBatteryType())) {
            swapStatus = Swap.SwapStatus.WAITING_USER_RETRY;
            description = "Pin khác model - chờ người dùng quay lại xác nhận trong 1 giờ.";
        }

        // Gắn pinIn vào slot nhận và xử lý SoH
        dockInSlot.setBattery(batteryIn);

        // Gán stationId cho pin dựa vào slot
        batteryIn.setStationId(dockInSlot.getDock().getStation().getStationId());
        batteryIn.setDockSlot(dockInSlot);

        if (batteryIn.getStateOfHealth() != null && batteryIn.getStateOfHealth() < 70.0) {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
            dockInSlot.setSlotStatus(DockSlot.SlotStatus.RESERVED); // Khóa slot
            description += " Pin trả SoH thấp, đã đặt vào slot và khóa (RESERVED), pin chuyển MAINTENANCE.";
        } else {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            dockInSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        }

        //  Nhả pinOut cho user
        batteryOut.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        dockOutSlot.setBattery(null);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.EMPTY);

        // Reset vị trí pinOut vì nó đã rời trạm
        batteryOut.setStationId(null);
        batteryOut.setDockSlot(null);

        //  Lưu DB
        batteryRepository.save(batteryIn);
        batteryRepository.save(batteryOut);
        dockSlotRepository.save(dockInSlot);
        dockSlotRepository.save(dockOutSlot);

        //Booking status
        if (swapStatus == Swap.SwapStatus.WAITING_USER_RETRY) {
            booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
        } else {
            booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
            booking.setCompletedTime(LocalDate.now());
        }
        bookingRepository.save(booking);

        // Lấy Staff userId từ SecurityContext hoặc request
        String currentStaffUserId = null;
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
            currentStaffUserId = auth.getName(); // ví dụ: ST001
        }
        if (currentStaffUserId == null || currentStaffUserId.isBlank()) {
            currentStaffUserId = request.getStaffUserId();
        }

        // Lưu Swap record
        Integer dockIdForRecord = dockOutSlot.getDock() != null ? dockOutSlot.getDock().getDockId() : stationId;

        Swap swap = Swap.builder()
                .booking(booking)
                .dockId(dockIdForRecord)
                .userId(booking.getUser().getUserId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .staffUserId(currentStaffUserId)
                .status(swapStatus)
                .dockOutSlot(dockOutCode)
                .dockInSlot(dockInCode)
                .completedTime(LocalDateTime.now())
                .description(description)
                .build();

        swapRepository.save(swap);

        // Response
        return SwapResponseDTO.builder()
                .swapId(swap.getSwapId())
                .status(swap.getStatus().toString())
                .message(swap.getDescription())
                .bookingId(booking.getBookingId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .dockOutSlot(dockOutCode)
                .dockInSlot(dockInCode)
                .build();
    }

}
