package BatterySwapStation.service;

import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SwapService {

    private final BookingRepository bookingRepo;
    private final BatteryRepository batteryRepo;
    private final StationRepository stationRepo;
    private final SwapRepository swapRepo;
    private final StaffAssignRepository staffAssignRepo;
    private final DockSlotRepository dockSlotRepo;

    @Transactional
    public SwapResponseDTO commitSwap(SwapRequest req) {

        Booking booking = bookingRepo.findById(req.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking"));

        Station station = booking.getStation();

        // Kiểm tra staff có thuộc trạm này không
        boolean authorized = staffAssignRepo.existsByUser_UserIdAndStationIdAndIsActiveTrue(
                req.getStaffUserId(), station.getStationId());
        if (!authorized) {
            throw new IllegalStateException("Staff không được phân công tại trạm này");
        }

        // Kiểm tra trong ngày (cho phép đến sớm trong ngày)
        if (!booking.getBookingDate().isEqual(LocalDate.now())) {
            throw new IllegalStateException("Chỉ được đổi pin trong ngày đã đặt lịch");
        }

        //  Lấy pin đầy trong trạm
        List<Battery> available = batteryRepo.findAvailableBatteriesAtStation(station.getStationId());
        if (available.isEmpty()) {
            throw new IllegalStateException("Không còn pin đầy trong trạm");
        }
        Battery batteryOut = available.get(0);

        // Pin khách mang đến
        Battery batteryIn = batteryRepo.findById(req.getBatteryInId())
                .orElseThrow(() -> new IllegalArgumentException("Pin cũ không hợp lệ"));

        Swap.SwapStatus swapStatus = Swap.SwapStatus.SUCCESS;
        String desc = "Đổi pin thành công";
        String dockOutSlotName = "";
        String dockInSlotName = "";

        //  Tìm slot nhả pin đầy
        DockSlot slotOut = dockSlotRepo.findByBatteryId(batteryOut.getBatteryId());
        if (slotOut != null) {
            dockOutSlotName = slotOut.getDock().getDockName() + " - Slot " + slotOut.getSlotNumber();
            // slotOut nhả pin -> trống
            slotOut.setBattery(null);
            dockSlotRepo.save(slotOut);
        }

        //  Kiểm tra model / SoH
        if (!batteryIn.getBatteryType().equals(batteryOut.getBatteryType())) {
            swapStatus = Swap.SwapStatus.WAITING_USER_RETRY;
            desc = "Model pin không khớp, chờ khách quay lại trong 1 giờ.";
        } else if (batteryIn.getStateOfHealth() < 70.0) {
            swapStatus = Swap.SwapStatus.FAULT;
            desc = "SoH pin thấp, cần bảo trì. Pin cũ không đút lại dock.";
        } else {
            // Nếu pin ổn → tìm slot trống để đút vào
            DockSlot slotIn = dockSlotRepo.findFirstEmptySlotAtStation(station.getStationId());
            if (slotIn != null) {
                slotIn.setBattery(batteryIn);
                dockInSlotName = slotIn.getDock().getDockName() + " - Slot " + slotIn.getSlotNumber();
                dockSlotRepo.save(slotIn);
            }
        }

        //  Cập nhật trạng thái pin
        batteryOut.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        if (swapStatus == Swap.SwapStatus.FAULT) {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
        } else if (swapStatus == Swap.SwapStatus.SUCCESS) {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.CHARGING);
        }

        //  Cập nhật Booking
        if (swapStatus == Swap.SwapStatus.WAITING_USER_RETRY) {
            booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
        } else {
            booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        }

        //  Ghi bản ghi Swap
        Swap swap = Swap.builder()
                .booking(booking)
                .dockId(slotOut != null ? slotOut.getDock().getDockId() : station.getStationId())
                .userId(booking.getUser().getUserId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .staffUserId(req.getStaffUserId())
                .status(swapStatus)
                .dockOutSlot(dockOutSlotName)
                .dockInSlot(dockInSlotName)
                .description(desc)
                .completedTime(LocalDateTime.now())
                .build();

        swapRepo.save(swap);
        batteryRepo.save(batteryIn);
        batteryRepo.save(batteryOut);
        bookingRepo.save(booking);

        return SwapResponseDTO.builder()
                .customerName(booking.getUser().getFullName())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .stationName(station.getStationName())
                .dockOutSlot(dockOutSlotName)
                .dockInSlot(dockInSlotName)
                .vehicleType(booking.getVehicleType())
                .batteryType(batteryOut.getBatteryType().toString())
                .completedTime(LocalDateTime.now())
                .message(desc)
                .build();
    }
}
