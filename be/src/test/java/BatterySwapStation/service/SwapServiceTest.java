package BatterySwapStation.service;

import BatterySwapStation.dto.SwapRequest;
import BatterySwapStation.dto.SwapResponseDTO;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SwapServiceTest {

    @Mock
    private SwapRepository swapRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private BatteryRepository batteryRepository;
    @Mock
    private DockSlotRepository dockSlotRepository;

    @InjectMocks
    private SwapService swapService;

    private Booking booking;
    private Battery batteryIn;
    private Battery batteryOut;
    private DockSlot dockInSlot;
    private DockSlot dockOutSlot;
    private SwapRequest request;

    @BeforeEach
    void setup() {
        booking = new Booking();
        booking.setBookingId(100L);
        booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
        booking.setBatteryType("LEAD_ACID");

        Station station = new Station();
        station.setStationId(1);
        booking.setStation(station);

        User user = new User();
        user.setUserId("USR001");
        booking.setUser(user);

        batteryIn = new Battery();
        batteryIn.setBatteryId("BAT001");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
        batteryIn.setActive(true);
        batteryIn.setStateOfHealth(95.0);

        batteryOut = new Battery();
        batteryOut.setBatteryId("BAT002");
        batteryOut.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryOut.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
        batteryOut.setActive(true);

        Dock dock = new Dock();
        dock.setDockId(10);
        dock.setDockName("A");
        dock.setStation(station);

        dockInSlot = new DockSlot();
        dockInSlot.setDock(dock);
        dockInSlot.setSlotNumber(1);
        dockInSlot.setActive(true);

        dockOutSlot = new DockSlot();
        dockOutSlot.setDock(dock);
        dockOutSlot.setSlotNumber(2);
        dockOutSlot.setBattery(batteryOut);
        dockOutSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);

        request = new SwapRequest();
        request.setBookingId(100L);
        request.setBatteryInId("BAT001");
        request.setStaffUserId("ST001");
    }

    // ✅ CASE 1: Swap thành công bình thường
    @Test
    void commitSwap_Success() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        assertTrue(result.getMessage().contains("Swap hoàn tất"));
        verify(swapRepository).save(any(Swap.class));
    }

    // ✅ CASE 2: Pin khác loại booking -> throw exception
    @Test
    void commitSwap_Fail_WrongModelComparedToBooking() {
        batteryIn.setBatteryType(Battery.BatteryType.LITHIUM_ION);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));

        assertTrue(ex.getMessage().contains("Pin không cùng loại"));
    }

    // ✅ CASE 3: Pin bị vô hiệu hóa
    @Test
    void commitSwap_Fail_BatteryInactive() {
        batteryIn.setActive(false);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("vô hiệu hóa"));
    }

    // ✅ CASE 4: Pin đang bảo trì
    @Test
    void commitSwap_Fail_BatteryUnderMaintenance() {
        batteryIn.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("bảo trì"));
    }

    // ✅ CASE 5: Pin chưa có loại (null type)
    @Test
    void commitSwap_Fail_BatteryTypeNull() {
        batteryIn.setBatteryType(null);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Pin chưa xác định loại"));
    }

    // ✅ CASE 6: Pin khác model -> WAITING_USER_RETRY
    @Test
    void commitSwap_WaitingUserRetry_DifferentModel() {
        // bỏ check đầu tiên để đi tới nhánh WAITING_USER_RETRY
        booking.setBatteryType(null);
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryOut.setBatteryType(Battery.BatteryType.LITHIUM_ION);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("WAITING_USER_RETRY", result.getStatus());
        assertTrue(result.getMessage().contains("Pin khác model"));
        verify(swapRepository).save(any(Swap.class));
    }

    // ✅ CASE 7: Booking đã completed -> không cho swap
    @Test
    void commitSwap_Fail_BookingAlreadyCompleted() {
        booking.setBookingStatus(Booking.BookingStatus.COMPLETED);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Booking đã hoàn thành"));
    }

    // ✅ CASE 8: Không còn slot trống để nhận pinIn
    @Test
    void commitSwap_Fail_NoEmptySlotForBatteryIn() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Không còn slot trống"));
    }

    // ✅ CASE 9: Pin có SoH thấp < 70 → chuyển MAINTENANCE và khóa slot
    @Test
    void commitSwap_Success_SoHLow_BatteryGoesMaintenance() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(65.0); // 🔸 SoH thấp
        batteryOut.setBatteryType(Battery.BatteryType.LEAD_ACID);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        assertTrue(result.getMessage().contains("SoH thấp"));
        assertEquals(Battery.BatteryStatus.MAINTENANCE, batteryIn.getBatteryStatus());
        assertEquals(DockSlot.SlotStatus.RESERVED, dockInSlot.getSlotStatus());
    }

    // ✅ CASE 10: Pin không có SoH (null) -> đi vào nhánh else
    @Test
    void commitSwap_Success_SoHNull_TreatedAsAvailable() {
        batteryIn.setStateOfHealth(null);
        booking.setBatteryType("LEAD_ACID");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        assertEquals(Battery.BatteryStatus.AVAILABLE, batteryIn.getBatteryStatus());
        assertEquals(DockSlot.SlotStatus.OCCUPIED, dockInSlot.getSlotStatus());
    }


    // ✅ CASE 11: Có SecurityContextHolder với staff userId
    @Test
    void commitSwap_Success_WithSecurityContext() {
        batteryIn.setStateOfHealth(95.0);
        booking.setBatteryType("LEAD_ACID");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // Giả lập SecurityContext
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("ST999");
        when(authentication.getName()).thenReturn("ST999");
        org.springframework.security.core.context.SecurityContext context =
                mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));
    }
    // ✅ CASE 12: Không còn pin khả dụng trong trạm
    @Test
    void commitSwap_Fail_NoBatteryOutAvailable() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Không còn pin đầy khả dụng"));
    }

    // ✅ CASE 13: Có SecurityContextHolder -> currentStaffUserId lấy từ auth
    @Test
    void commitSwap_Success_WithAuthenticatedStaffContext() {
        // Setup data
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // 🔹 Giả lập SecurityContext có xác thực staff
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("STCTX");
        when(authentication.getName()).thenReturn("STCTX");

        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        // Run
        SwapResponseDTO result = swapService.commitSwap(request);

        // Assert
        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        // Reset context sau test
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    // ✅ CASE 14: Slot chứa pinOut nhưng batteryOut = null → ném lỗi hợp lệ
    @Test
    void commitSwap_Fail_BatteryOutNull() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        // 🔹 Giả lập dockOutSlot có battery = null
        DockSlot brokenDock = new DockSlot();
        brokenDock.setDock(dockOutSlot.getDock());
        brokenDock.setSlotNumber(3);
        brokenDock.setBattery(null); // Lỗi chính ở đây
        brokenDock.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);

        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(brokenDock));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Slot chứa pinOut không hợp lệ"));
    }
    @Test
    void commitSwap_Success_NoSecurityContext_UseRequestStaffId() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // Không set SecurityContextHolder
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));
    }

    @Test
    void commitSwap_Fail_BatteryNotFound() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Không tìm thấy pin"));
    }

    @Test
    void commitSwap_Fail_BookingNotFound() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> swapService.commitSwap(request));
        assertTrue(ex.getMessage().contains("Không tìm thấy booking"));
    }

    @Test
    void commitSwap_Success_AuthNotAuthenticated_FallbackToRequestStaff() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
    }

    // ✅ CASE 12: Không còn pin đầy khả dụng trong trạm
    @Test
    void commitSwap_Fail_BatteryOutNotAvailable() {
        // 🔹 Setup: booking và batteryIn hợp lệ
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));

        // 🔹 Giả lập: không có pin đầy khả dụng trong trạm
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.empty());

        // 🔹 Gọi hàm và bắt exception
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> swapService.commitSwap(request));

        // 🔹 Kiểm tra thông báo lỗi
        String msg = ex.getMessage();
        System.out.println("Actual exception message: " + msg);
        assertTrue(
                msg.contains("Không còn pin đầy khả dụng"),
                "Expected message to contain 'Không còn pin đầy khả dụng'"
        );
    }

    @Test
    void commitSwap_Success_AuthNotAuthenticated_FallbackToRequestStaffId() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // 🔹 Giả lập auth tồn tại nhưng chưa xác thực
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);
        when(authentication.getPrincipal()).thenReturn("STXXX");
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
    @Test
    void commitSwap_Success_AuthPrincipalNull_UsesRequestStaffId() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(null);
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
    @Test
    void commitSwap_Success_DockOutWithoutDock_UsesStationIdForRecord() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        DockSlot missingDockSlot = new DockSlot();
        missingDockSlot.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        missingDockSlot.setBattery(batteryOut);
        missingDockSlot.setDock(null); // 👈 trigger nhánh else

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(missingDockSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
    }
    @Test
    void commitSwap_Success_BatteryInAlreadyInSlot() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.of(dockInSlot));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
    }
    @Test
    void commitSwap_Success_SoHHigh_RemainsAvailable() {
        batteryIn.setStateOfHealth(85.0);
        booking.setBatteryType("LEAD_ACID");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals(Battery.BatteryStatus.AVAILABLE, batteryIn.getBatteryStatus());
    }


    @Test
    void commitSwap_Success_StaffUserIdBlank_FallbackHandled() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(90.0);

        // 🔹 request có staffUserId rỗng
        request.setStaffUserId("");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // 🔹 Giả lập SecurityContext đầy đủ
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("STFALLBACK");
        when(authentication.getName()).thenReturn("STFALLBACK");
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);
        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
    @Test
    void commitSwap_Success_AuthPrincipalNullAndNameNull_FallbackToRequestStaffId() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // 🔹 Giả lập auth có authenticated=true, principal=null, name=null
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(null);
        when(authentication.getName()).thenReturn(null); // 👈
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
    @Test
    void commitSwap_Success_WhenSecurityContextCompletelyNull() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(95.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // ⚡️ Trick: mock static method getContext() để trả về null
        try (var mocked = mockStatic(org.springframework.security.core.context.SecurityContextHolder.class)) {
            mocked.when(org.springframework.security.core.context.SecurityContextHolder::getContext)
                    .thenReturn(null);

            SwapResponseDTO result = swapService.commitSwap(request);

            assertEquals("SUCCESS", result.getStatus());
            verify(swapRepository).save(any(Swap.class));
        }
    }
    @Test
    void commitSwap_Success_StaffUserIdAlreadyValid_NoFallbackTriggered() {
        booking.setBatteryType("LEAD_ACID");
        batteryIn.setBatteryType(Battery.BatteryType.LEAD_ACID);
        batteryIn.setStateOfHealth(90.0);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(batteryRepository.findById("BAT001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                        1, DockSlot.SlotStatus.OCCUPIED, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(Optional.of(dockOutSlot));
        when(dockSlotRepository.findByBattery_BatteryId("BAT001")).thenReturn(Optional.empty());
        when(dockSlotRepository
                .findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(1))
                .thenReturn(Optional.of(dockInSlot));

        // 🔹 Giả lập auth hợp lệ với principal hợp lệ
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("ST888");
        when(authentication.getName()).thenReturn("ST888");
        var context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        // 🔹 request có staff ID hợp lệ (để không fallback)
        request.setStaffUserId("ST888");

        SwapResponseDTO result = swapService.commitSwap(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any(Swap.class));

        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }


}
