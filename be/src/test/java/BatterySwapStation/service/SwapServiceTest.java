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
import org.springframework.context.ApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // ⚡ fix UnnecessaryStubbingException
class SwapServiceTest {

    @Mock private SwapRepository swapRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BatteryRepository batteryRepository;
    @Mock private DockSlotRepository dockSlotRepository;
    @Mock private StaffAssignRepository staffAssignRepository;
    @Mock private ApplicationContext context;

    @InjectMocks private SwapService swapService;

    private Booking booking;
    private Battery batteryIn;
    private Battery batteryOut;
    private DockSlot dockSlotIn;
    private DockSlot dockSlotOut;

    @BeforeEach
    void setup() {
        booking = new Booking();
        booking.setBookingId(1L);
        booking.setBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);
        booking.setBatteryType("LFP");
        Station station = new Station();
        station.setStationId(101);
        booking.setStation(station);
        booking.setBatteryCount(1);

        batteryIn = new Battery();
        batteryIn.setBatteryId("BIN001");
        batteryIn.setBatteryStatus(Battery.BatteryStatus.IN_USE);
        batteryIn.setBatteryType(Battery.BatteryType.LITHIUM_ION);
        batteryIn.setActive(true);

        batteryOut = new Battery();
        batteryOut.setBatteryId("BOUT001");
        batteryOut.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
        batteryOut.setBatteryType(Battery.BatteryType.LITHIUM_ION);
        batteryOut.setActive(true);

        Dock dock = new Dock();
        dock.setDockName("A");
        dock.setDockId(10);
        dock.setStation(station);

        dockSlotOut = new DockSlot();
        dockSlotOut.setSlotStatus(DockSlot.SlotStatus.OCCUPIED);
        dockSlotOut.setBattery(batteryOut);
        dockSlotOut.setDock(dock);

        dockSlotIn = new DockSlot();
        dockSlotIn.setSlotStatus(DockSlot.SlotStatus.EMPTY);
        dockSlotIn.setDock(dock);

        User user = new User();
        user.setUserId("U001"); // hoặc ID nào cũng được
        booking.setUser(user);

    }

    // ============================ cancelSwap ============================
    @Test
    void testCancelSwap_TEMP() {
        Swap swap = new Swap();
        swap.setSwapId(1L);
        swap.setBooking(booking);
        when(swapRepository.findById(1L)).thenReturn(Optional.of(swap));

        Map<String, Object> result = (Map<String, Object>) swapService.cancelSwap(1L, "TEMP");
        assertEquals("CANCELLED_TEMP", result.get("status"));
        verify(swapRepository).save(swap);
    }

    @Test
    void testCancelSwap_PERMANENT() {
        Swap swap = new Swap();
        swap.setSwapId(2L);
        swap.setBooking(booking);
        swap.setBatteryInId("BIN001");
        swap.setBatteryOutId("BOUT001");

        when(swapRepository.findById(2L)).thenReturn(Optional.of(swap));
        when(batteryRepository.findById("BIN001")).thenReturn(Optional.of(batteryIn));
        when(batteryRepository.findById("BOUT001")).thenReturn(Optional.of(batteryOut));
        when(dockSlotRepository.findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(101))
                .thenReturn(Optional.of(dockSlotIn));

        Map<String, Object> result = (Map<String, Object>) swapService.cancelSwap(2L, "PERMANENT");

        assertEquals("CANCELLED", result.get("status"));
        verify(batteryRepository, times(2)).save(any());
        verify(dockSlotRepository).save(any());
        verify(bookingRepository).save(any());
        verify(swapRepository).save(any());
    }

    @Test
    void testCancelSwap_InvalidType() {
        Swap swap = new Swap();
        swap.setSwapId(3L);
        swap.setBooking(booking);
        when(swapRepository.findById(3L)).thenReturn(Optional.of(swap));
        assertThrows(IllegalArgumentException.class,
                () -> swapService.cancelSwap(3L, "RANDOM"));
    }

    @Test
    void testCancelSwap_NotFound() {
        when(swapRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> swapService.cancelSwap(999L, "TEMP"));
    }

    // ============================ commitSwap ============================
    @Test
    void testCommitSwap_SuccessSingleBattery() {
        SwapRequest req = new SwapRequest();
        req.setBookingId(1L);
        req.setBatteryInIds(List.of("BIN001"));
        req.setStaffUserId("ST001");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(staffAssignRepository.existsByStationIdAndUser_UserId(101, "ST001")).thenReturn(true);
        when(dockSlotRepository.countByDock_Station_StationIdAndBattery_BatteryStatus(101, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(2L);

        SwapService spyService = spy(swapService);
        when(context.getBean(SwapService.class)).thenReturn(spyService);
        SwapResponseDTO mockResponse = SwapResponseDTO.builder()
                .status("SUCCESS")
                .batteryInId("BIN001")
                .batteryOutId("BOUT001")
                .build();
        doReturn(mockResponse).when(spyService).handleSingleSwap(any(), any(), any());

        Object result = swapService.commitSwap(req);
        assertTrue(result instanceof SwapResponseDTO);
        verify(bookingRepository).save(any());
    }

    @Test
    void testCommitSwap_BookingNotFound() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());
        SwapRequest req = new SwapRequest();
        req.setBookingId(99L);
        assertThrows(IllegalArgumentException.class, () -> swapService.commitSwap(req));
    }

    @Test
    void testCommitSwap_MissingStaffUserId() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(dockSlotRepository.countByDock_Station_StationIdAndBattery_BatteryStatus(anyInt(), any()))
                .thenReturn(2L); // ✅ thêm mock tránh lỗi “Trạm hiện không còn pin đầy...”
        SwapRequest req = new SwapRequest();
        req.setBookingId(1L);
        req.setBatteryInIds(List.of("BIN001"));
        assertThrows(IllegalArgumentException.class, () -> swapService.commitSwap(req));
    }

    @Test
    void testCommitSwap_StaffNotInStation() {
        SwapRequest req = new SwapRequest();
        req.setBookingId(1L);
        req.setBatteryInIds(List.of("BIN001"));
        req.setStaffUserId("ST001");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(dockSlotRepository.countByDock_Station_StationIdAndBattery_BatteryStatus(101, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(2L);
        when(staffAssignRepository.existsByStationIdAndUser_UserId(101, "ST001")).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> swapService.commitSwap(req));
    }

    @Test
    void testCommitSwap_NoAvailableBattery() {
        SwapRequest req = new SwapRequest();
        req.setBookingId(1L);
        req.setBatteryInIds(List.of("BIN001"));
        req.setStaffUserId("ST001");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(staffAssignRepository.existsByStationIdAndUser_UserId(101, "ST001")).thenReturn(true);
        when(dockSlotRepository.countByDock_Station_StationIdAndBattery_BatteryStatus(101, Battery.BatteryStatus.AVAILABLE))
                .thenReturn(0L);

        assertThrows(IllegalStateException.class, () -> swapService.commitSwap(req));
    }

    // ============================ handleSingleSwap ============================
    @Test
    void testHandleSingleSwap_SuccessSameModel() {
        booking.setBatteryType("LITHIUM_ION"); // 🔧 thêm dòng này để trùng model

        when(batteryRepository.findById("BIN001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository.findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                anyInt(), any(), any())).thenReturn(Optional.of(dockSlotOut));
        when(dockSlotRepository.findByBattery_BatteryId("BIN001")).thenReturn(Optional.of(dockSlotIn));

        SwapResponseDTO result = swapService.handleSingleSwap(booking, "BIN001", "ST001");
        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        verify(swapRepository).save(any());
    }

    @Test
    void testHandleSingleSwap_DifferentModel() {
        // 🔧 Test mong đợi lỗi khác model (theo đúng logic thật)
        batteryIn.setBatteryType(Battery.BatteryType.NICKEL_METAL_HYDRIDE);
        when(batteryRepository.findById("BIN001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository.findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                anyInt(), any(), any())).thenReturn(Optional.of(dockSlotOut));
        when(dockSlotRepository.findByBattery_BatteryId("BIN001")).thenReturn(Optional.of(dockSlotIn));

        assertThrows(IllegalStateException.class,
                () -> swapService.handleSingleSwap(booking, "BIN001", "ST001"));
    }

    @Test
    void testHandleSingleSwap_BatteryDisabled() {
        batteryIn.setActive(false);
        when(batteryRepository.findById("BIN001")).thenReturn(Optional.of(batteryIn));
        assertThrows(IllegalStateException.class,
                () -> swapService.handleSingleSwap(booking, "BIN001", "ST001"));
    }

    @Test
    void testHandleSingleSwap_NoAvailableSlot() {
        when(batteryRepository.findById("BIN001")).thenReturn(Optional.of(batteryIn));
        when(dockSlotRepository.findFirstByDock_Station_StationIdAndSlotStatusAndBattery_BatteryStatusOrderByDock_DockNameAscSlotNumberAsc(
                anyInt(), any(), any())).thenReturn(Optional.of(dockSlotOut));
        when(dockSlotRepository.findByBattery_BatteryId("BIN001")).thenReturn(Optional.empty());
        when(dockSlotRepository.findFirstByDock_Station_StationIdAndIsActiveTrueAndBatteryIsNull(anyInt()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> swapService.handleSingleSwap(booking, "BIN001", "ST001"));
    }
}
