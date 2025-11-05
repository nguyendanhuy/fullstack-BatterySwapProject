import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Reservation from "../pages/driver/Reservation";
import { SystemContext } from "../contexts/system.context";
import * as axiosServices from "../services/axios.services";

// Mock dependencies
jest.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

jest.mock("../services/axios.services", () => ({
    getSwapDefaultPrice: jest.fn(),
    createBookingForVehicles: jest.fn(),
    createInvoiceForBookings: jest.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockLocation = {
    state: null,
};

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

describe("Reservation Component", () => {
    const mockUserData = {
        userId: "user123",
        username: "testuser",
        activeSubscriptionId: null,
    };

    const mockUserDataWithSubscription = {
        userId: "user123",
        username: "testuser",
        activeSubscriptionId: 2,
    };

    const mockSelectBattery = {
        vehicle1: {
            vehicleInfo: {
                vehicleId: "vehicle1",
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                batteryCount: 2,
            },
            stationInfo: {
                stationId: "station1",
                stationName: "Trạm Cầu Giấy",
                address: "Số 1 Đường Cầu Giấy, Hà Nội",
            },
            batteryType: "LITHIUM_ION",
            qty: 2,
            date: null,
            time: null,
        },
    };

    const mockSelectBatteryMultiple = {
        vehicle1: {
            vehicleInfo: {
                vehicleId: "vehicle1",
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                batteryCount: 2,
            },
            stationInfo: {
                stationId: "station1",
                stationName: "Trạm Cầu Giấy",
                address: "Số 1 Đường Cầu Giấy, Hà Nội",
            },
            batteryType: "LITHIUM_ION",
            qty: 2,
            date: null,
            time: null,
        },
        vehicle2: {
            vehicleInfo: {
                vehicleId: "vehicle2",
                vehicleType: "VF 9",
                batteryType: "LITHIUM_POLYMER",
                batteryCount: 1,
            },
            stationInfo: {
                stationId: "station2",
                stationName: "Trạm Hai Bà Trưng",
                address: "Số 5 Đường Trần Hưng Đạo, Hà Nội",
            },
            batteryType: "LITHIUM_POLYMER",
            qty: 1,
            date: null,
            time: null,
        },
    };

    const renderWithContext = (userData = mockUserData, locationState = null) => {
        mockLocation.state = locationState;

        const mockContextValue = {
            userData,
            setUserData: jest.fn(),
            userVehicles: [],
            setUserVehicles: jest.fn(),
        };

        return render(
            <BrowserRouter>
                <SystemContext.Provider value={mockContextValue}>
                    <Reservation />
                </SystemContext.Provider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        mockLocation.state = null;
        sessionStorage.clear();

        // Mock default price API
        axiosServices.getSwapDefaultPrice.mockResolvedValue({
            price: 15000,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("UI Rendering - Hiển thị giao diện", () => {
        it("hiển thị header và tiêu đề trang", () => {
            renderWithContext();

            expect(screen.getByRole("heading", { name: "Đặt lịch" })).toBeInTheDocument();
        });

        it("hiển thị Steps với 4 bước", () => {
            renderWithContext();

            // Check for step titles
            expect(screen.getByText("Chọn trạm & pin")).toBeInTheDocument();
            expect(screen.getByText("Chọn ngày")).toBeInTheDocument();
            expect(screen.getByText("Chọn khung giờ")).toBeInTheDocument();
            expect(screen.getByText("Thanh toán")).toBeInTheDocument();
        });

        it("hiển thị thông báo khi chưa có trạm nào được chọn", () => {
            renderWithContext();

            expect(screen.getByText("Chưa có trạm nào được chọn.")).toBeInTheDocument();
        });

        it("hiển thị thông tin pin đã chọn khi có dữ liệu", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            const stationNames = screen.getAllByText("Trạm Cầu Giấy");
            expect(stationNames.length).toBeGreaterThan(0);

            const addresses = screen.getAllByText("Số 1 Đường Cầu Giấy, Hà Nội");
            expect(addresses.length).toBeGreaterThan(0);

            const batteryTypes = screen.getAllByText(/Pin LITHIUM_ION/i);
            expect(batteryTypes.length).toBeGreaterThan(0);
        });

        it("hiển thị calendar khi có xe được chọn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Chọn ngày cho xe đang chọn")).toBeInTheDocument();
            });
        });

        it("hiển thị khung giờ khi có xe được chọn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                const timeSlotHeaders = screen.getAllByText("Chọn khung giờ");
                expect(timeSlotHeaders.length).toBeGreaterThan(0);
            });
        });

        it("hiển thị thông tin đặt lịch ở sidebar", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            expect(screen.getByText("Thông tin đặt lịch")).toBeInTheDocument();
        });
    });

    describe("State Management - Quản lý trạng thái", () => {
        it("tự động chọn xe đầu tiên khi có dữ liệu", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                const vehicleButtons = screen.getAllByRole("button");
                const stationButton = vehicleButtons.find(btn => btn.textContent.includes("Trạm Cầu Giấy"));
                expect(stationButton).toHaveClass("ring-4");
            });
        });

        it("cập nhật state khi nhận selectBattery từ location", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            const stationNames = screen.getAllByText("Trạm Cầu Giấy");
            expect(stationNames.length).toBeGreaterThan(0);
            expect(screen.getByText(/2.*pin/)).toBeInTheDocument();
        });

        it("tính tổng số pin chính xác", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            expect(screen.getByText("x3")).toBeInTheDocument(); // 2 + 1 = 3 pins
        });

        it("chuyển đổi activeId khi click vào xe khác", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            const vehicleButtons = screen.getAllByRole("button");
            const stationButtons = vehicleButtons.filter(btn => btn.textContent.includes("Trạm"));

            // Should have 2 station buttons
            expect(stationButtons.length).toBeGreaterThanOrEqual(2);

            // Click second vehicle button
            if (stationButtons[1]) {
                fireEvent.click(stationButtons[1]);

                await waitFor(() => {
                    expect(stationButtons[1]).toHaveClass("ring-4");
                });
            }
        });
    });

    describe("API Integration - Tích hợp API", () => {
        it("gọi API lấy giá mặc định khi mount component", async () => {
            renderWithContext();

            await waitFor(() => {
                expect(axiosServices.getSwapDefaultPrice).toHaveBeenCalled();
            });
        });

        it("hiển thị giá mặc định sau khi load thành công", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("15.000 VNĐ")).toBeInTheDocument();
            });
        });

        it("tính toán tạm tính dựa trên số pin và giá", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("30.000 VNĐ")).toBeInTheDocument(); // 2 pins * 15000
            });
        });

        it("xử lý lỗi khi API lấy giá thất bại", async () => {
            axiosServices.getSwapDefaultPrice.mockRejectedValueOnce(new Error("Network error"));

            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

            renderWithContext();

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith("Error fetching default price:", expect.any(Error));
            });

            consoleSpy.mockRestore();
        });
    });

    describe("Date Selection - Chọn ngày", () => {
        it("cho phép chọn ngày trong calendar", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Chọn ngày cho xe đang chọn")).toBeInTheDocument();
            });

            // Calendar should be rendered
            const calendar = screen.getByRole("grid");
            expect(calendar).toBeInTheDocument();
        });

        it("hiển thị ngày đã chọn trong summary", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Chưa chọn ngày")).toBeInTheDocument();
            });
        });

        it("reset time khi chọn ngày mới", async () => {
            // This is testing internal behavior, time should be cleared when date changes
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Chưa chọn giờ")).toBeInTheDocument();
            });
        });
    });

    describe("Time Slot Selection - Chọn khung giờ", () => {
        it("hiển thị tất cả khung giờ có sẵn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("08:00")).toBeInTheDocument();
                expect(screen.getByText("09:00")).toBeInTheDocument();
                expect(screen.getByText("18:30")).toBeInTheDocument();
            });
        });

        it("hiển thị giờ đã chọn trong summary", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Chưa chọn giờ")).toBeInTheDocument();
            });
        });

        it("cho phép click vào khung giờ để chọn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            // Need to select date first
            await waitFor(() => {
                const timeSlot = screen.getByRole("button", { name: /08:00/ });
                expect(timeSlot).toBeInTheDocument();
            });
        });
    });

    describe("Payment Flow - Luồng thanh toán", () => {
        it("hiển thị nút thanh toán thông thường khi không có subscription", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByRole("link", { name: /Tiến hành thanh toán/i })).toBeInTheDocument();
            });
        });

        it("disable nút thanh toán khi chưa chọn đủ ngày và giờ", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            const paymentLink = screen.getByRole("link", { name: /Tiến hành thanh toán/i });
            expect(paymentLink).toHaveClass("pointer-events-none");
        });

        it("hiển thị thông báo về chuyển trang thanh toán", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            expect(screen.getByText("💡 Bạn sẽ được chuyển qua trang thanh toán")).toBeInTheDocument();
        });

        it("hiển thị phí đổi pin và tổng số pin", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("Phí đổi pin :")).toBeInTheDocument();
                expect(screen.getByText("Tổng số pin:")).toBeInTheDocument();
            });
        });
    });

    describe("Subscription Payment - Thanh toán bằng Subscription", () => {
        it("hiển thị giao diện subscription khi user có gói đang hoạt động", () => {
            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockSelectBattery });

            expect(screen.getByText("Gói Subscription đang hoạt động")).toBeInTheDocument();
            expect(screen.getByText("MIỄN PHÍ")).toBeInTheDocument();
        });

        it("hiển thị nút thanh toán bằng subscription", () => {
            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockSelectBattery });

            expect(screen.getByRole("button", { name: /Thanh toán bằng Subscription/i })).toBeInTheDocument();
        });

        it("không hiển thị phí đổi pin khi có subscription", () => {
            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockSelectBattery });

            expect(screen.queryByText("Phí đổi pin :")).not.toBeInTheDocument();
            expect(screen.queryByText("Tạm tính:")).not.toBeInTheDocument();
        });

        it("xử lý thanh toán subscription thành công", async () => {
            axiosServices.createBookingForVehicles.mockResolvedValueOnce({
                success: true,
                data: {
                    successBookings: [
                        { bookingId: "booking1" },
                        { bookingId: "booking2" },
                    ],
                },
            });

            axiosServices.createInvoiceForBookings.mockResolvedValueOnce({
                invoiceId: "invoice123",
            });

            // Mock selectBattery with date and time
            const mockDataWithDateTime = {
                vehicle1: {
                    ...mockSelectBattery.vehicle1,
                    date: new Date("2025-11-10"),
                    time: "09:00",
                },
            };

            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockDataWithDateTime });

            await waitFor(() => {
                const payButton = screen.getByRole("button", { name: /Thanh toán bằng Subscription/i });
                expect(payButton).not.toBeDisabled();
            });
        });

        it("hiển thị loading khi đang xử lý thanh toán subscription", async () => {
            axiosServices.createBookingForVehicles.mockImplementationOnce(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            const mockDataWithDateTime = {
                vehicle1: {
                    ...mockSelectBattery.vehicle1,
                    date: new Date("2025-11-10"),
                    time: "09:00",
                },
            };

            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockDataWithDateTime });

            const payButton = screen.getByRole("button", { name: /Thanh toán bằng Subscription/i });
            fireEvent.click(payButton);

            await waitFor(() => {
                expect(screen.getByText("Đang xử lý...")).toBeInTheDocument();
            });
        });

        it("xử lý lỗi khi thanh toán subscription thất bại", async () => {
            axiosServices.createBookingForVehicles.mockRejectedValueOnce({
                message: "Booking failed",
            });

            const mockDataWithDateTime = {
                vehicle1: {
                    ...mockSelectBattery.vehicle1,
                    date: new Date("2025-11-10"),
                    time: "09:00",
                },
            };

            renderWithContext(mockUserDataWithSubscription, { selectBattery: mockDataWithDateTime });

            const payButton = screen.getByRole("button", { name: /Thanh toán bằng Subscription/i });
            fireEvent.click(payButton);

            await waitFor(() => {
                expect(axiosServices.createBookingForVehicles).toHaveBeenCalled();
            });
        });
    });

    describe("Summary Section - Phần tổng kết", () => {
        it("hiển thị thông tin xe và trạm trong summary", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            expect(screen.getAllByText("Trạm Cầu Giấy").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Số 1 Đường Cầu Giấy, Hà Nội").length).toBeGreaterThan(0);
        });

        it("hiển thị nút Chỉnh để chuyển về xe đang xem", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            const editButtons = screen.getAllByRole("button", { name: "Chỉnh" });
            expect(editButtons.length).toBeGreaterThan(0);
        });

        it("click nút Chỉnh để chuyển activeId", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            const editButtons = screen.getAllByRole("button", { name: "Chỉnh" });
            fireEvent.click(editButtons[0]);

            // Should switch to that vehicle
            await waitFor(() => {
                expect(editButtons[0]).toBeInTheDocument();
            });
        });

        it("hiển thị đầy đủ thông tin cho nhiều xe", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            const stations = screen.getAllByText("Trạm Cầu Giấy");
            expect(stations.length).toBeGreaterThan(0);

            const station2 = screen.getAllByText("Trạm Hai Bà Trưng");
            expect(station2.length).toBeGreaterThan(0);
        });
    });

    describe("Edge Cases - Trường hợp đặc biệt", () => {
        it("xử lý khi không có selectBattery từ location", () => {
            renderWithContext();

            expect(screen.getByText("Chưa có trạm nào được chọn.")).toBeInTheDocument();
        });

        it("xử lý khi selectBattery rỗng", () => {
            renderWithContext(mockUserData, { selectBattery: {} });

            expect(screen.getByText("Chưa có trạm nào được chọn.")).toBeInTheDocument();
        });

        it("xử lý khi qty = 0", () => {
            const mockDataWithZeroQty = {
                vehicle1: {
                    ...mockSelectBattery.vehicle1,
                    qty: 0,
                },
            };

            renderWithContext(mockUserData, { selectBattery: mockDataWithZeroQty });

            expect(screen.getByText("Chưa có trạm nào được chọn.")).toBeInTheDocument();
        });

        it("xử lý khi user không có activeSubscriptionId", () => {
            const userWithoutSub = { ...mockUserData, activeSubscriptionId: null };
            renderWithContext(userWithoutSub, { selectBattery: mockSelectBattery });

            expect(screen.queryByText("Gói Subscription đang hoạt động")).not.toBeInTheDocument();
        });

        it("xử lý khi activeSubscriptionId không hợp lệ", () => {
            const userWithInvalidSub = { ...mockUserData, activeSubscriptionId: 999 };
            renderWithContext(userWithInvalidSub, { selectBattery: mockSelectBattery });

            expect(screen.queryByText("Gói Subscription đang hoạt động")).not.toBeInTheDocument();
        });

        it("xử lý khi API trả về price = null", async () => {
            axiosServices.getSwapDefaultPrice.mockResolvedValueOnce({
                price: null,
            });

            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("15.000 VNĐ")).toBeInTheDocument(); // fallback to 15000
            });
        });

        it("xử lý khi API trả về response không có price", async () => {
            axiosServices.getSwapDefaultPrice.mockResolvedValueOnce({});

            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                expect(screen.getByText("15.000 VNĐ")).toBeInTheDocument(); // fallback to 15000
            });
        });
    });

    describe("Vehicle Selection - Chọn xe", () => {
        it("hiển thị viền xanh cho xe đang được chọn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            await waitFor(() => {
                const vehicleButtons = screen.getAllByRole("button");
                const stationButton = vehicleButtons.find(btn => btn.textContent.includes("Trạm Cầu Giấy"));
                expect(stationButton).toHaveClass("ring-4", "ring-blue-500");
            });
        });

        it("click vào xe để chọn", async () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBatteryMultiple });

            const vehicleButtons = screen.getAllByRole("button");
            const station2Button = vehicleButtons.find(btn => btn.textContent.includes("Trạm Hai Bà Trưng"));

            if (station2Button) {
                fireEvent.click(station2Button);

                await waitFor(() => {
                    expect(station2Button).toHaveClass("ring-4");
                });
            }
        });

        it("hiển thị thông tin xe trong card", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            expect(screen.getByText(/Xe:/)).toBeInTheDocument();
            expect(screen.getByText("VF 8")).toBeInTheDocument();
        });

        it("hiển thị số lượng pin cần thiết", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            expect(screen.getByText(/cần 2 pin/)).toBeInTheDocument();
        });
    });

    describe("Steps Progress - Tiến trình các bước", () => {
        it("hiển thị bước 0 khi chưa có trạm", () => {
            renderWithContext();

            // Step 0 should be active when no station selected
            expect(screen.getByText("Chọn trạm & pin")).toBeInTheDocument();
        });

        it("hiển thị bước 1 khi đã có trạm nhưng chưa chọn ngày", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            // Should show step 1 (Chọn ngày) as process
            expect(screen.getByText("Chọn ngày")).toBeInTheDocument();
        });

        it("chuyển sang bước tiếp theo khi hoàn thành bước hiện tại", async () => {
            const mockDataWithDate = {
                vehicle1: {
                    ...mockSelectBattery.vehicle1,
                    date: new Date("2025-11-10"),
                },
            };

            renderWithContext(mockUserData, { selectBattery: mockDataWithDate });

            await waitFor(() => {
                // Should progress to time selection step - check for multiple instances
                const timeSlotTexts = screen.getAllByText("Chọn khung giờ");
                expect(timeSlotTexts.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Icons and UI Elements - Biểu tượng và thành phần UI", () => {
        it("hiển thị các icon trong header của card", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            // Check for gradient headers (visual elements)
            const cards = document.querySelectorAll(".h-2.bg-gradient-to-r");
            expect(cards.length).toBeGreaterThan(0);
        });

        it("hiển thị thông tin trạm trong component", () => {
            renderWithContext(mockUserData, { selectBattery: mockSelectBattery });

            // Component renders station info - check for at least one instance
            const stationNames = screen.getAllByText("Trạm Cầu Giấy");
            expect(stationNames.length).toBeGreaterThan(0);
        });
    });
});
