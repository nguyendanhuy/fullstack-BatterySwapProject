package BatterySwapStation.service;

import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.context.ApplicationContext;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
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

    // ====================== CANCEL SWAP ======================
    @Transactional
    public Object cancelSwap(Long swapId, String cancelType) {
        Swap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy swap #" + swapId));

        Booking booking = swap.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Không xác định được booking của swap này.");
        }

        // 🔹 TEMP = hủy tạm thời (user có thể quay lại retry)
        if ("TEMP".equalsIgnoreCase(cancelType)) {
            swap.setStatus(Swap.SwapStatus.CANCELLED_TEMP);
            swap.setDescription("Swap bị hủy tạm thời. Chờ người dùng quay lại xác nhận.");
            swapRepository.save(swap);
            return Map.of(
                    "swapId", swapId,
                    "status", "CANCELLED_TEMP",
                    "message", "Đã hủy tạm thời swap #" + swapId
            );
        }

        // 🔹 PERMANENT = hủy hoàn toàn, rollback dữ liệu
        if ("PERMANENT".equalsIgnoreCase(cancelType)) {
            String batteryOutId = swap.getBatteryOutId();
            String batteryInId = swap.getBatteryInId();

            Battery batteryOut = batteryRepository.findById(batteryOutId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pinOut: " + batteryOutId));
            Battery batteryIn = batteryRepository.findById(batteryInId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pinIn: " + batteryInId));

            DockSlot emptySlot = dockSlotRepository
                    .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(
                            booking.getStation().getStationId())
                    .orElseThrow(() -> new IllegalStateException("Không còn slot trống để trả pinOut."));
            emptySlot.setBattery(batteryOut);
            emptySlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);

            batteryOut.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            batteryOut.setStationId(booking.getStation().getStationId());
            batteryOut.setDockSlot(emptySlot);

            batteryIn.setDockSlot(null);
            batteryIn.setStationId(null);
            batteryIn.setBatteryStatus(Battery.BatteryStatus.IN_USE);

            batteryRepository.save(batteryOut);
            batteryRepository.save(batteryIn);
            dockSlotRepository.save(emptySlot);

            booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
            booking.setCancellationReason("Staff hủy swap khác model (permanent cancel).");

            swap.setStatus(Swap.SwapStatus.CANCELLED);
            swap.setDescription("Staff đã hủy hoàn toàn swap khác model. Đã rollback pin.");

            bookingRepository.save(booking);
            swapRepository.save(swap);

            return Map.of(
                    "swapId", swapId,
                    "status", "CANCELLED",
                    "message", "Đã hủy hoàn toàn swap #" + swapId + " và rollback pin thành công."
            );
        }

        throw new IllegalArgumentException("Loại hủy không hợp lệ: " + cancelType);
    }


    // ====================== COMMIT SWAP ======================
    @Transactional
    public Object commitSwap(SwapRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking ID: " + request.getBookingId()));

        if (booking.getBookingStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Booking đã hoàn thành, không thể swap lại.");
        }

        List<String> batteryInIds = request.getBatteryInIds();
        if (batteryInIds == null || batteryInIds.isEmpty()) {
            throw new IllegalArgumentException("Thiếu thông tin pin khách đưa.");
        }

        Integer requiredCount = (booking.getBatteryCount() != null && booking.getBatteryCount() > 0)
                ? booking.getBatteryCount() : 1;

        if (batteryInIds.size() < requiredCount) {
            throw new IllegalArgumentException("Booking #" + booking.getBookingId() + " yêu cầu đổi " + requiredCount + " pin, nhưng chỉ nhận được " + batteryInIds.size() + ".");
        }
        if (batteryInIds.size() > requiredCount) {
            throw new IllegalArgumentException("Booking #" + booking.getBookingId() + " chỉ cho phép đổi " + requiredCount + " pin, nhưng đã nhập " + batteryInIds.size() + ".");
        }

        long availableCount = dockSlotRepository.countByDock_Station_StationIdAndBattery_BatteryStatus(
                booking.getStation().getStationId(), Battery.BatteryStatus.AVAILABLE);

        if (availableCount == 0) {
            throw new IllegalStateException("Trạm hiện không còn pin đầy khả dụng để thực hiện swap.");
        } else if (availableCount < requiredCount) {
            System.out.println("⚠️ Cảnh báo: Trạm chỉ có " + availableCount + "/" + requiredCount + " pin đầy.");
        }

        // ✅ Lấy staffUserId chuẩn
        String currentStaffUserId = resolveStaffUserId(request);
        if (currentStaffUserId == null || currentStaffUserId.isBlank()) {
            throw new IllegalArgumentException("Thiếu mã nhân viên (staffUserId) trong request.");
        }

        boolean staffInStation = staffAssignRepository.existsByStationIdAndUser_UserId(
                booking.getStation().getStationId(), currentStaffUserId);
        if (!staffInStation) {
            throw new IllegalStateException("Nhân viên không thuộc trạm này, không thể thực hiện swap.");
        }

        List<SwapResponseDTO> results = new ArrayList<>();
        for (String batteryInId : batteryInIds) {
            try {
                SwapService self = context.getBean(SwapService.class);
                SwapResponseDTO response = self.handleSingleSwap(booking, batteryInId, currentStaffUserId);
                results.add(response);
            } catch (Exception e) {
                results.add(SwapResponseDTO.builder()
                        .bookingId(booking.getBookingId())
                        .batteryInId(batteryInId)
                        .status("FAILED")
                        .message(e.getMessage())
                        .build());
            }
        }

        long successSwaps = swapRepository.countByBooking_BookingIdAndStatus(
                booking.getBookingId(), Swap.SwapStatus.SUCCESS);

        if (successSwaps >= requiredCount) {
            booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
            booking.setCompletedTime(LocalDate.now());
        } else {
            booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
        }

        bookingRepository.save(booking);
        return results.size() == 1 ? results.get(0) : results;
    }


    // ====================== AUTO CANCEL ======================
    @Scheduled(fixedRate = 600000)
    @Transactional
    public void autoCancelUnconfirmedSwaps() {
        List<Swap> waitingSwaps = swapRepository.findByStatus(Swap.SwapStatus.WAITING_USER_RETRY);
        LocalDateTime now = LocalDateTime.now();

        for (Swap swap : waitingSwaps) {
            if (swap.getCompletedTime() != null && Duration.between(swap.getCompletedTime(), now).toHours() >= 1) {
                Booking booking = swap.getBooking();
                if (booking != null && booking.getBookingStatus() == Booking.BookingStatus.COMPLETED) {
                    booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
                    booking.setCancellationReason("Tự động hủy swap khác model sau 1 tiếng không xác nhận.");
                    bookingRepository.save(booking);
                }
                swap.setStatus(Swap.SwapStatus.CANCELLED);
                swap.setDescription("Tự động hủy swap khác model sau 1 tiếng không xác nhận.");
                swapRepository.save(swap);
            }
        }
    }

    // ====================== HANDLE SINGLE SWAP ======================
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected SwapResponseDTO handleSingleSwap(Booking booking, String batteryInId, String staffUserId) {
        Integer stationId = booking.getStation().getStationId();

        Battery batteryIn = batteryRepository.findById(batteryInId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy pin khách đưa: " + batteryInId));
        if (!batteryIn.isActive()) throw new IllegalStateException("Pin " + batteryInId + " bị vô hiệu hóa.");
        if (batteryIn.getBatteryStatus() == Battery.BatteryStatus.MAINTENANCE)
            throw new IllegalStateException("Pin " + batteryInId + " đang bảo trì.");
        if (batteryIn.getBatteryType() == null)
            throw new IllegalStateException("Pin " + batteryInId + " chưa xác định loại.");

        String bookedType = booking.getBatteryType();
        if (bookedType != null && !batteryIn.getBatteryType().name().equalsIgnoreCase(bookedType))
            throw new IllegalStateException("Pin " + batteryInId + " không cùng loại với pin đã booking.");

        // ✅ Chọn pinOut cùng model với booking hoặc pinIn
        DockSlot dockOutSlot = dockSlotRepository
                .findFirstByDock_Station_StationIdAndBattery_BatteryTypeAndBattery_BatteryStatusAndSlotStatusOrderByDock_DockNameAscSlotNumberAsc(
                        stationId,
                        batteryIn.getBatteryType(),
                        Battery.BatteryStatus.AVAILABLE,
                        DockSlot.SlotStatus.OCCUPIED
                )
                .orElseThrow(() -> new IllegalStateException("Không còn pin đầy đúng model trong trạm."));

        Battery batteryOut = dockOutSlot.getBattery();
        if (batteryOut == null)
            throw new IllegalStateException("Slot chứa pinOut không hợp lệ (không có pin).");

        DockSlot dockInSlot = dockSlotRepository.findByBattery_BatteryId(batteryInId).orElse(null);
        if (dockInSlot == null) {
            dockInSlot = dockSlotRepository
                    .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(stationId)
                    .orElseThrow(() -> new IllegalStateException("Không còn slot trống trong trạm để nhận pinIn."));
        }

        String dockOutCode = (dockOutSlot.getDock() != null)
                ? dockOutSlot.getDock().getDockName() + dockOutSlot.getSlotNumber()
                : "UNKNOWN" + dockOutSlot.getSlotNumber();
        String dockInCode = dockInSlot.getDock().getDockName() + dockInSlot.getSlotNumber();

        Swap.SwapStatus swapStatus = Swap.SwapStatus.SUCCESS;
        String description = "Swap hoàn tất.";

        // ⚠️ Nếu trạm vẫn lỡ chọn nhầm model, fallback cảnh báo
        if (!batteryIn.getBatteryType().equals(batteryOut.getBatteryType())) {
            swapStatus = Swap.SwapStatus.WAITING_USER_RETRY;
            description = "Pin khác model - chờ người dùng xác nhận.";
        }

        dockInSlot.setBattery(batteryIn);
        batteryIn.setStationId(dockInSlot.getDock().getStation().getStationId());
        batteryIn.setDockSlot(dockInSlot);

        if (batteryIn.getStateOfHealth() != null && batteryIn.getStateOfHealth() < 70.0) {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
            dockInSlot.setSlotStatus(DockSlot.SlotStatus.RESERVED);
            description += " Pin SoH thấp, chuyển MAINTENANCE.";
        } else {
            batteryIn.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            dockInSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        }

        batteryOut.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        dockOutSlot.setBattery(null);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.EMPTY);
        batteryOut.setStationId(null);
        batteryOut.setDockSlot(null);

        batteryRepository.save(batteryIn);
        batteryRepository.save(batteryOut);
        dockSlotRepository.save(dockInSlot);
        dockSlotRepository.save(dockOutSlot);

        Integer dockIdForRecord = dockOutSlot.getDock() != null ? dockOutSlot.getDock().getDockId() : stationId;
        Swap swap = Swap.builder()
                .booking(booking)
                .dockId(dockIdForRecord)
                .userId(booking.getUser().getUserId())
                .batteryOutId(batteryOut.getBatteryId())
                .batteryInId(batteryIn.getBatteryId())
                .staffUserId(staffUserId)
                .status(swapStatus)
                .dockOutSlot(dockOutCode)
                .dockInSlot(dockInCode)
                .completedTime(LocalDateTime.now())
                .description(description)
                .build();

        swapRepository.save(swap);

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

    //  RESOLVE STAFF ID
    private String resolveStaffUserId(SwapRequest request) {
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;

        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();
            if (principal != null && !"anonymousUser".equals(principal)) {
                String name = auth.getName();
                if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
                    return name; // ví dụ ST005
                }
            }
        }

        if (request.getStaffUserId() != null && !request.getStaffUserId().isBlank()) {
            return request.getStaffUserId();
        }

        throw new IllegalStateException("Thiếu staffUserId (chưa đăng nhập staff hoặc không truyền staffUserId).");
    }
}
