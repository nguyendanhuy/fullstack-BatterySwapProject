package BatterySwapStation.service;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import BatterySwapStation.websocket.BatterySocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
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
    private final BatterySocketController batterySocketController;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        batteryIn.setBatteryStatus(Battery.BatteryStatus.WAITING);
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

        sendRealtimeUpdate(slotForOut, "RETURNED");
        sendRealtimeUpdate(slotForIn, "INSERTED");

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

        Integer vehicleId = booking.getVehicle().getVehicleId();

        for (String batteryInId : batteryInIds) {
            Battery battery = batteryRepository.findById(batteryInId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin #" + batteryInId));

            if (battery.getBatteryType() == null)
                throw new IllegalStateException("Pin " + batteryInId + " chưa xác định loại model.");

            if (!battery.getBatteryType().name().equalsIgnoreCase(booking.getBatteryType()))
                throw new IllegalStateException("Pin " + batteryInId + " khác model (" +
                        battery.getBatteryType().name() + " ≠ " + booking.getBatteryType() + ").");

            // 🔥 CHECK PIN PHẢI THUỘC XE
            if (battery.getVehicle() == null || battery.getVehicle().getVehicleId() != vehicleId)
                throw new IllegalStateException("Pin " + batteryInId + " không thuộc xe #" + vehicleId);
        }

        long availableCount = dockSlotRepository
                .countByDock_Station_StationIdAndBattery_BatteryStatus(
                        booking.getStation().getStationId(), Battery.BatteryStatus.AVAILABLE);

        if (availableCount < requiredCount)
            throw new IllegalStateException("Không đủ pin đầy khả dụng để swap.");

        String currentStaffUserId = resolveStaffUserId(request);
        boolean staffInStation = staffAssignRepository.existsActiveAssign(
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
        return results;
    }

    // ====================== HANDLE SINGLE SWAP ======================
    // ====================== HANDLE SINGLE SWAP ======================
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected SwapResponseDTO handleSingleSwap(
            Booking booking, String batteryInId, String staffUserId, Set<String> usedDockSlots) {

        // ===== FIX SESSION: TRÁNH LỖI proxy với 2 open sessions =====
        booking = bookingRepository.findById(booking.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking trong session mới"));
        // =============================================================

        Integer stationId = booking.getStation().getStationId();

        Battery batteryIn = batteryRepository.findById(batteryInId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin khách đưa: " + batteryInId));

        if (!batteryIn.isActive())
            throw new IllegalStateException("Pin " + batteryInId + " bị vô hiệu hoá.");

        if (batteryIn.getBatteryStatus() == Battery.BatteryStatus.MAINTENANCE)
            throw new IllegalStateException("Pin " + batteryInId + " đang bảo trì.");

        if (batteryIn.getStationId() != null && !batteryIn.getStationId().equals(stationId))
            throw new IllegalStateException("Pin nhập thuộc trạm khác (#" + batteryIn.getStationId() + ").");

        if (batteryIn.getDockSlot() != null) {
            DockSlot s = batteryIn.getDockSlot();
            throw new IllegalStateException("Pin " + batteryIn.getBatteryId() +
                    " đang nằm ở dock " + s.getDock().getDockName() + s.getSlotNumber());
        }

        List<DockSlot> candidateSlots = dockSlotRepository
                .findAllByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
                        stationId,
                        batteryIn.getBatteryType(),
                        Battery.BatteryStatus.AVAILABLE,
                        DockSlot.SlotStatus.OCCUPIED
                );

        candidateSlots.removeIf(slot ->
                slot.getBattery() == null ||
                        slot.getBattery().getBatteryStatus() != Battery.BatteryStatus.AVAILABLE ||
                        usedDockSlots.contains(slot.getDock().getDockName() + slot.getSlotNumber())
        );

        DockSlot dockOutSlot = candidateSlots.stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Không còn pin đầy sẵn sàng để swap."));

        Battery batteryOut = dockOutSlot.getBattery();
        String dockCode = dockOutSlot.getDock().getDockName() + dockOutSlot.getSlotNumber();

        // 🟦 Pin OUT -> giao khách
        batteryOut.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        batteryOut.setStationId(null);
        batteryOut.setDockSlot(null);

        // 🔥 Pin OUT gắn vào đúng xe
        batteryOut.setVehicle(booking.getVehicle());

        batteryRepository.save(batteryOut);

        dockOutSlot.setBattery(null);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.EMPTY);
        dockSlotRepository.save(dockOutSlot);
        sendRealtimeUpdate(dockOutSlot, "REMOVED");

        // 🟩 Pin IN -> WAITING
        batteryIn.setBatteryStatus(Battery.BatteryStatus.WAITING);
        batteryIn.setStationId(stationId);

        // 🔥 Xoá pin IN khỏi xe nếu trước đó gắn vào xe khác
        batteryIn.setVehicle(null);

        batteryIn.setDockSlot(dockOutSlot);

        if (batteryIn.getCurrentCapacity() == null || batteryIn.getCurrentCapacity() <= 0.0)
            batteryIn.setCurrentCapacity(10.0);

        dockOutSlot.setBattery(batteryIn);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);

        batteryRepository.save(batteryIn);
        dockSlotRepository.save(dockOutSlot);

        sendRealtimeUpdate(dockOutSlot, "INSERTED");
        sendRealtimeUpdate(dockOutSlot, "STATUS_CHANGED");

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
                .description("Swap xong: giao " + batteryOut.getBatteryId() +
                        ", nhận " + batteryIn.getBatteryId() + " (chờ kiểm tra/sạc)")
                .build();

        swapRepository.save(swap);

        return SwapResponseDTO.builder()
                .swapId(swap.getSwapId())
                .status("SUCCESS")
                .message("Swap thành công: giao " + batteryOut.getBatteryId() +
                        ", nhận " + batteryIn.getBatteryId() + " (chờ kiểm tra/sạc)")
                .bookingId(booking.getBookingId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .dockOutSlot(dockCode)
                .dockInSlot(dockCode)
                .build();
    }


    // ====================== REALTIME (STOMP) ======================
    private void sendRealtimeUpdate(DockSlot slot, String action) {
        try {
            var battery = slot.getBattery();
            var dock = slot.getDock();
            var station = dock.getStation();

            BatteryRealtimeEvent event = BatteryRealtimeEvent.builder()
                    .stationId(station.getStationId())
                    .dockId(slot.getDockSlotId())
                    .dockName(dock.getDockName())
                    .slotNumber(slot.getSlotNumber())
                    .batteryId(battery != null ? battery.getBatteryId() : null)
                    .batteryStatus(battery != null ? battery.getBatteryStatus().name() : "EMPTY")
                    .stateOfHealth(battery != null ? battery.getStateOfHealth() : null)
                    .currentCapacity(battery != null ? battery.getCurrentCapacity() : null)
                    .action(action)
                    .timestamp(LocalDateTime.now().toString())
                    .build();

            String json = objectMapper.writeValueAsString(event);
            batterySocketController.broadcastToStation(event.getStationId(), json);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

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
    public List<SwapDetail> getSwapsByStation(Integer stationId) {
        return swapRepository.findDetailedSwapsByStation(stationId);
    }

    @Transactional(readOnly = true)
    public List<SwapDetail> getDetailedSwapsByStation(Integer stationId) {
        return swapRepository.findDetailedSwapsByStation(stationId);
    }

    // ====================== CHECK MODEL (PIN THUỘC XE) ======================
    @Transactional(readOnly = true)
    public ApiResponse checkBatteryModel(BatteryModelCheckRequest req) {

        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + req.getBookingId()));

        Integer vehicleId = booking.getVehicle().getVehicleId();
        List<String> batteryIds = req.getBatteryIds();

        if (batteryIds == null || batteryIds.isEmpty()) {
            return new ApiResponse(false, "Thiếu danh sách mã pin cần kiểm tra.");
        }

        List<Map<String, Object>> results = new ArrayList<>();

        for (String batteryId : batteryIds) {
            Map<String, Object> info = new HashMap<>();
            info.put("batteryId", batteryId);

            Battery battery = batteryRepository.findById(batteryId).orElse(null);

            if (battery == null) {
                info.put("valid", false);
                info.put("message", "Không tìm thấy pin #" + batteryId);
                results.add(info);
                continue;
            }

            boolean belong = (battery.getVehicle() != null
                    && battery.getVehicle().getVehicleId() == vehicleId);

            info.put("valid", belong);
            info.put("message",
                    belong ? "Pin thuộc đúng xe — OK"
                            : "Pin không thuộc xe — KHÔNG thể swap");

            results.add(info);
        }

        boolean allValid = results.stream().allMatch(r -> Boolean.TRUE.equals(r.get("valid")));

        return new ApiResponse(
                allValid,
                allValid ? "Tất cả pin thuộc xe, có thể swap."
                        : "Một hoặc nhiều pin không thuộc xe.",
                results
        );
    }
}
