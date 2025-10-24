package BatterySwapStation.service;

import BatterySwapStation.dto.BatteryRealtimeEvent;
import BatterySwapStation.dto.SwapListItemDTO;
import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SwapService {
    @Autowired
    private ApplicationContext context;
    private final SwapRepository swapRepository;
    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;
    private final DockSlotRepository dockSlotRepository;
    private final StaffAssignRepository staffAssignRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ====================== CANCEL SWAP ======================
    @Transactional
    public Object cancelSwapByBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + bookingId));

        Swap swap = swapRepository.findTopByBooking_BookingIdOrderBySwapIdDesc(bookingId)
                .orElse(null);

        if (swap == null) {
            booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
            booking.setCancellationReason("Staff hủy booking (chưa phát sinh swap).");
            bookingRepository.save(booking);
            return Map.of("bookingId", bookingId, "status", "CANCELLED",
                    "message", "Đã hủy booking #" + bookingId + " do khách đem sai loại pin.");
        }

        String batteryOutId = swap.getBatteryOutId();
        String batteryInId = swap.getBatteryInId();
        if (batteryOutId == null || batteryInId == null) {
            booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
            booking.setCancellationReason("Thiếu thông tin pin.");
            swap.setStatus(Swap.SwapStatus.CANCELLED);
            bookingRepository.save(booking);
            swapRepository.save(swap);
            return Map.of("bookingId", bookingId, "status", "CANCELLED",
                    "message", "Hủy booking #" + bookingId + " do thiếu thông tin pin.");
        }

        Battery batteryOut = batteryRepository.findById(batteryOutId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pinOut: " + batteryOutId));
        Battery batteryIn = batteryRepository.findById(batteryInId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pinIn: " + batteryInId));

        Integer stationId = booking.getStation().getStationId();

        // 1️⃣ PinOut: trả lại dock trống
        if (batteryOut.getDockSlot() != null) {
            DockSlot old = batteryOut.getDockSlot();
            old.setBattery(null);
            old.setSlotStatus(DockSlot.SlotStatus.EMPTY);
            dockSlotRepository.save(old);
            batteryOut.setDockSlot(null);
        }

        DockSlot slotForOut = dockSlotRepository
                .findFirstByDock_Station_StationIdAndBatteryIsNullAndIsActiveTrue(stationId)
                .orElseThrow(() -> new IllegalStateException("Không còn slot trống để trả pinOut."));

        slotForOut.setBattery(batteryOut);
        slotForOut.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        batteryOut.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
        batteryOut.setStationId(stationId);
        batteryOut.setDockSlot(slotForOut);

        // 2️⃣ PinIn: giữ lại để sạc
        DockSlot slotForIn = dockSlotRepository
                .findFirstByDock_Station_StationIdAndBatteryIsNullAndIsActiveTrue(stationId)
                .orElseThrow(() -> new IllegalStateException("Không còn slot trống để nhận pin khách trả."));

        if (slotForIn.getDockSlotId().equals(slotForOut.getDockSlotId())) {
            slotForIn = dockSlotRepository
                    .findFirstByDock_Station_StationIdAndBatteryIsNullAndIsActiveTrue(stationId)
                    .orElseThrow(() -> new IllegalStateException("Không còn slot khác để nhận pin khách trả."));
        }

        slotForIn.setBattery(batteryIn);
        slotForIn.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        batteryIn.setBatteryStatus(Battery.BatteryStatus.WAITING_CHARGE);
        batteryIn.setStationId(stationId);
        batteryIn.setDockSlot(slotForIn);

        dockSlotRepository.saveAll(List.of(slotForOut, slotForIn));
        batteryRepository.saveAll(List.of(batteryOut, batteryIn));

        booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason("Hủy swap thành công.");
        swap.setStatus(Swap.SwapStatus.CANCELLED);
        swap.setDescription("Hủy swap: pinOut trả lại trạm (AVAILABLE), pinIn đang sạc (CHARGING).");

        bookingRepository.save(booking);
        swapRepository.save(swap);

        return Map.of(
                "bookingId", bookingId,
                "status", "CANCELLED",
                "message", "Hủy Swap thành công."
        );
    }

    // ====================== COMMIT SWAP ======================
    @Transactional
    public Object commitSwap(SwapRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking ID: " + request.getBookingId()));

        if (booking.getBookingStatus() == Booking.BookingStatus.COMPLETED)
            throw new IllegalStateException("Booking đã hoàn thành, không thể swap lại.");

        List<String> batteryInIds = request.getBatteryInIds();
        if (batteryInIds == null || batteryInIds.isEmpty())
            throw new IllegalArgumentException("Thiếu thông tin pin khách đưa.");

        Integer requiredCount = (booking.getBatteryCount() != null && booking.getBatteryCount() > 0)
                ? booking.getBatteryCount() : 1;

        if (batteryInIds.size() != requiredCount)
            throw new IllegalArgumentException("Số lượng pin nhập không khớp với booking yêu cầu (" + requiredCount + ").");

        // Kiểm tra model từng pinIn
        for (String batteryInId : batteryInIds) {
            Battery battery = batteryRepository.findById(batteryInId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin #" + batteryInId));

            if (battery.getBatteryType() == null)
                throw new IllegalStateException("Pin " + batteryInId + " chưa xác định loại model.");

            if (!battery.getBatteryType().name().equalsIgnoreCase(booking.getBatteryType()))
                throw new IllegalStateException("Pin " + batteryInId + " khác model (" +
                        battery.getBatteryType().name() + " ≠ " + booking.getBatteryType() + ").");
        }

        long availableCount = dockSlotRepository
                .countByDock_Station_StationIdAndBattery_BatteryStatus(
                        booking.getStation().getStationId(), Battery.BatteryStatus.AVAILABLE);
        if (availableCount < requiredCount)
            throw new IllegalStateException("Không đủ pin đầy khả dụng để swap.");

        String currentStaffUserId = resolveStaffUserId(request);
        boolean staffInStation = staffAssignRepository.existsByStationIdAndUser_UserId(
                booking.getStation().getStationId(), currentStaffUserId);
        if (!staffInStation)
            throw new IllegalStateException("Nhân viên không thuộc trạm này, không thể thực hiện swap.");

        Set<String> usedDockSlots = new HashSet<>();
        List<SwapResponseDTO> results = new ArrayList<>();

        for (String batteryInId : batteryInIds) {
            SwapService self = context.getBean(SwapService.class);
            SwapResponseDTO res = self.handleSingleSwap(booking, batteryInId, currentStaffUserId, usedDockSlots);
            usedDockSlots.add(res.getDockOutSlot());
            results.add(res);
        }

        booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedTime(LocalDate.now());
        bookingRepository.save(booking);

        return results.size() == 1 ? results.get(0) : results;
    }

    // ====================== HANDLE SINGLE SWAP ======================
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected SwapResponseDTO handleSingleSwap(Booking booking, String batteryInId, String staffUserId, Set<String> usedDockSlots) {
        Integer stationId = booking.getStation().getStationId();
        Battery batteryIn = batteryRepository.findById(batteryInId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin khách đưa: " + batteryInId));

        if (!batteryIn.isActive())
            throw new IllegalStateException("Pin " + batteryInId + " bị vô hiệu hóa.");
        if (batteryIn.getBatteryStatus() == Battery.BatteryStatus.MAINTENANCE)
            throw new IllegalStateException("Pin " + batteryInId + " đang bảo trì.");

        // 🔹 Tìm pinOut phù hợp
        List<DockSlot> availableSlots = dockSlotRepository
                .findAllByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
                        stationId,
                        batteryIn.getBatteryType(),
                        Battery.BatteryStatus.AVAILABLE,
                        DockSlot.SlotStatus.OCCUPIED
                );

        availableSlots.removeIf(slot ->
                slot.getBattery() == null ||
                        slot.getBattery().getBatteryId().equals(batteryInId) ||
                        usedDockSlots.contains(slot.getDock().getDockName() + slot.getSlotNumber())
        );

        DockSlot dockOutSlot = availableSlots.stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Không còn slot khả dụng khác cho swap."));

        Battery batteryOut = dockOutSlot.getBattery();
        String dockCode = dockOutSlot.getDock().getDockName() + dockOutSlot.getSlotNumber();

        // 1️⃣ Nhả pinOut
        batteryOut.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        batteryOut.setStationId(null);
        batteryOut.setDockSlot(null);
        dockOutSlot.setBattery(null);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.EMPTY);

        batteryRepository.save(batteryOut);
        dockSlotRepository.save(dockOutSlot);
        batteryRepository.flush();
        dockSlotRepository.flush();

        // 🔔 Gửi realtime: pinOut bị lấy ra
        sendRealtimeUpdate(dockOutSlot, "REMOVED");

        // 2️⃣ Gắn pinIn vào slot (CHARGING)
        batteryIn.setBatteryStatus(Battery.BatteryStatus.CHARGING);
        batteryIn.setStationId(stationId);
        batteryIn.setDockSlot(dockOutSlot);
        if (batteryIn.getCurrentCapacity() == null || batteryIn.getCurrentCapacity() <= 0.0)
            batteryIn.setCurrentCapacity(10.0);

        dockOutSlot.setBattery(batteryIn);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);

        batteryRepository.save(batteryIn);
        dockSlotRepository.save(dockOutSlot);

        // 🔔 Gửi realtime: pinIn mới được đưa vào trạm
        sendRealtimeUpdate(dockOutSlot, "INSERTED");

        // 3️⃣ Ghi swap record
        Swap swap = Swap.builder()
                .booking(booking)
                .dockId(dockOutSlot.getDock().getDockId())
                .userId(booking.getUser().getUserId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .staffUserId(staffUserId)
                .status(Swap.SwapStatus.SUCCESS)
                .dockOutSlot(dockCode)
                .dockInSlot(dockCode)
                .completedTime(LocalDateTime.now())
                .description("Swap hoàn tất: Trạm giao " + batteryOut.getBatteryId() +
                        ", nhận lại " + batteryIn.getBatteryId() + " từ khách để sạc.")
                .build();
        swapRepository.save(swap);

        // Gửi realtime tổng thể: trạng thái slot đã thay đổi
        sendRealtimeUpdate(dockOutSlot, "STATUS_CHANGED");

        return SwapResponseDTO.builder()
                .swapId(swap.getSwapId())
                .status("SUCCESS")
                .message("Swap thành công: " + batteryOut.getBatteryId() + " đã giao, " +
                        batteryIn.getBatteryId() + " đang sạc tại trạm.")
                .bookingId(booking.getBookingId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .dockOutSlot(dockCode)
                .dockInSlot(dockCode)
                .build();
    }
    // ====================== RESOLVE STAFF ID ======================
    private String resolveStaffUserId(SwapRequest request) {
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;
        if (auth != null && auth.isAuthenticated()) {
            String name = auth.getName();
            if (name != null && !"anonymousUser".equalsIgnoreCase(name)) return name;
        }
        if (request.getStaffUserId() != null && !request.getStaffUserId().isBlank())
            return request.getStaffUserId();
        throw new IllegalStateException("Thiếu staffUserId (chưa đăng nhập staff hoặc không truyền staffUserId).");
    }

    @Transactional(readOnly = true)
    public List<SwapListItemDTO> getSwapsByStation(Integer stationId) {
        List<Swap> swaps = swapRepository.findAllByStationId(stationId);
        return swaps.stream().map(this::toListItemDTO).toList();
    }

    private SwapListItemDTO toListItemDTO(Swap s) {
        return SwapListItemDTO.builder()
                .swapId(s.getSwapId())
                .bookingId(s.getBooking().getBookingId())
                .stationId(s.getBooking().getStation().getStationId())
                .userId(s.getUserId())
                .staffUserId(s.getStaffUserId())
                .batteryOutId(s.getBatteryOutId())
                .batteryInId(s.getBatteryInId())
                .dockOutSlot(s.getDockOutSlot())
                .dockInSlot(s.getDockInSlot())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .completedTime(s.getCompletedTime())
                .description(s.getDescription())
                .build();
    }

    private void sendRealtimeUpdate(DockSlot slot, String action) {
        var battery = slot.getBattery();
        var dock = slot.getDock();
        var station = dock.getStation();

        BatteryRealtimeEvent event = BatteryRealtimeEvent.builder()
                .stationId(station.getStationId())
                .dockName(dock.getDockName())
                .slotNumber(slot.getSlotNumber())
                .batteryId(battery != null ? battery.getBatteryId() : null)
                .batteryStatus(battery != null ? battery.getBatteryStatus().name() : "EMPTY")
                .stateOfHealth(battery != null ? battery.getStateOfHealth() : null)
                .currentCapacity(battery != null ? battery.getCurrentCapacity() : null)
                .action(action)
                .timestamp(LocalDateTime.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/station-" + station.getStationId(), event);
    }
}
