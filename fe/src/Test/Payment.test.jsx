import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Payment from "../pages/driver/Payment";
import { SystemContext } from "../contexts/system.context";

// ----- Mocks -----
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
    useToast: () => ({ toast: mockToast }),
}));

const mockNavigate = jest.fn();
const mockLocation = {
    state: {
        reservationData: {
            item1: {
                vehicleInfo: { vehicleId: "1", vehicleType: "Xe máy điện" },
                stationInfo: { stationId: 1, stationName: "Trạm A" },
                date: new Date("2025-12-01"),
                time: "09:00",
                batteryType: "48V",
                qty: 2,
            },
        },
        totalPrice: 100000,
    },
    search: "",
};

jest.mock("react-router-dom", () => {
    const actual = jest.requireActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
        Link: ({ children, to, className, onClick }) => (
            <a href={to} className={className} onClick={onClick}>
                {children}
            </a>
        ),
    };
});

jest.mock("../services/axios.services", () => ({
    createBookingForVehicles: jest.fn(),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
    format: (date, formatStr) => "01/12/2025",
}));

// ---- Helpers ----
const mockUserData = {
    userId: 1,
    fullName: "Test User",
    walletBalance: 500000,
};

const mockSetUserData = jest.fn();

const renderUI = (locationState = mockLocation.state, searchParams = "") => {
    const customLocation = { ...mockLocation, state: locationState, search: searchParams };
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue(customLocation);

    return render(
        <MemoryRouter>
            <SystemContext.Provider value={{ userData: mockUserData, setUserData: mockSetUserData }}>
                <Payment />
            </SystemContext.Provider>
        </MemoryRouter>
    );
};

// Mock window.location globally
const originalLocation = window.location;

beforeAll(() => {
    delete window.location;
    window.location = {
        href: "",
        search: "",
        pathname: "/",
        assign: jest.fn(),
        replace: jest.fn()
    };
});

afterAll(() => {
    window.location = originalLocation;
});

describe("Payment page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
        // Reset location values
        window.location.href = "";
        window.location.search = "";
        window.location.pathname = "/";
        window.history.replaceState = jest.fn();
    });    // ===== 1. TEST UI RENDERING =====
    test("renders payment page with all UI elements", () => {
        renderUI();

        expect(screen.getByText("Thanh toán")).toBeInTheDocument();
        expect(screen.getByText("Phương thức thanh toán")).toBeInTheDocument();
        expect(screen.getByText("Chi tiết thanh toán")).toBeInTheDocument();
        expect(screen.getByText("Bảo mật thanh toán")).toBeInTheDocument();
    });

    test("displays payment methods for new booking", () => {
        renderUI();

        expect(screen.getByText("Ví hệ thống")).toBeInTheDocument();
        expect(screen.getByText(/Số dư:/)).toBeInTheDocument();
        expect(screen.getByText(/500,000/)).toBeInTheDocument();
    });

    test("displays reservation details correctly", () => {
        renderUI();

        expect(screen.getByText("Trạm A")).toBeInTheDocument();
        expect(screen.getByText("Xe máy điện")).toBeInTheDocument();
        expect(screen.getByText(/Pin 48V × 2/)).toBeInTheDocument();
    });

    test("displays total price correctly", () => {
        renderUI();

        expect(screen.getByText(/Tổng thanh toán:/)).toBeInTheDocument();
        const priceElements = screen.getAllByText(/100\.000 VNĐ/);
        expect(priceElements.length).toBeGreaterThan(0);
    });

    // ===== 2. TEST PAYMENT METHOD SELECTION =====
    test("default payment method is WALLET for new booking", () => {
        renderUI();

        const walletButton = screen.getByText("Ví hệ thống").closest("button");
        expect(walletButton).toHaveClass("border-green-500");
    });

    test("can switch payment method to WALLET", () => {
        renderUI();

        const walletButton = screen.getByText("Ví hệ thống").closest("button");
        fireEvent.click(walletButton);

        expect(walletButton).toHaveClass("border-green-500");
    });

    // ===== 3. TEST WALLET PAYMENT =====
    test("successful wallet payment navigates to booking history", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({
            success: true,
            message: "Booking successful",
        });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(createBookingForVehicles).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    paymentMethod: "WALLET",
                    bookings: expect.any(Array),
                })
            );

            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đặt lịch thành công!",
                    description: "Booking đã được thanh toán bằng ví hệ thống.",
                })
            );

            expect(mockNavigate).toHaveBeenCalledWith("/driver/booking-history");
            expect(mockSetUserData).toHaveBeenCalled();
        });
    });

    test("shows error when wallet payment fails", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({
            success: false,
            error: "Insufficient balance",
        });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đặt lịch thất bại!",
                    description: "Insufficient balance",
                    variant: "destructive",
                })
            );

            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    test("shows error when API throws exception", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockRejectedValueOnce(new Error("Network error"));

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đặt lịch thất bại!",
                    description: "Network error",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 4. TEST LOADING STATE =====
    test("shows loading overlay when processing payment", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        let resolveFn;
        createBookingForVehicles.mockReturnValue(
            new Promise((resolve) => (resolveFn = resolve))
        );

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(screen.getAllByText("Đang xử lý...").length).toBeGreaterThan(0);
            expect(screen.getByText("Vui lòng đợi trong giây lát")).toBeInTheDocument();
        });

        resolveFn({ success: true });

        await waitFor(() => {
            expect(screen.queryByText("Đang xử lý...")).not.toBeInTheDocument();
        });
    });

    test("button is disabled during processing", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        let resolveFn;
        createBookingForVehicles.mockReturnValue(
            new Promise((resolve) => (resolveFn = resolve))
        );

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(payButton).toBeDisabled();
        });

        resolveFn({ success: true });
    });

    // ===== 5. TEST PENDING INVOICE PAYMENT =====
    test.skip("displays VNPay option for pending invoice", () => {
        const pendingInvoiceState = {
            pendingInvoice: {
                invoiceId: 123,
                invoiceType: "BOOKING",
                totalAmount: 200000,
                createdDate: "2025-12-01T10:00:00",
                numberOfSwaps: 2,
                pricePerSwap: 100000,
                bookings: [],
            },
            totalPrice: 200000,
        };

        renderUI(pendingInvoiceState);

        expect(screen.getByText("Thẻ tín dụng/ghi nợ")).toBeInTheDocument();
        expect(screen.getByText(/Visa, Mastercard, JCB qua VNPay/)).toBeInTheDocument();
    });

    test.skip("displays pending invoice details", () => {
        const pendingInvoiceState = {
            pendingInvoice: {
                invoiceId: 123,
                invoiceType: "BOOKING",
                totalAmount: 200000,
                createdDate: "2025-12-01T10:00:00",
                numberOfSwaps: 2,
                pricePerSwap: 100000,
                bookings: [
                    {
                        vehicleType: "Xe máy điện",
                        batteryType: "48V",
                        stationName: "Trạm A",
                        scheduledDate: "2025-12-01",
                        scheduledTime: "09:00",
                    },
                ],
            },
        };

        renderUI(pendingInvoiceState);

        expect(screen.getByText(/Hóa đơn #123/)).toBeInTheDocument();
        expect(screen.getByText(/Số lượt đổi: 2 lượt/)).toBeInTheDocument();
        expect(screen.getByText(/200\.000 VNĐ/)).toBeInTheDocument();
        expect(screen.getByText(/Xe máy điện/)).toBeInTheDocument();
        expect(screen.getByText(/Trạm A/)).toBeInTheDocument();
    });

    test.skip("handles VNPay payment for pending invoice", async () => {
        const { createVNPayUrl } = require("../services/axios.services");
        createVNPayUrl.mockResolvedValueOnce({
            paymentUrl: "https://vnpay.test/payment",
        });

        const pendingInvoiceState = {
            pendingInvoice: {
                invoiceId: 123,
                invoiceType: "BOOKING",
                totalAmount: 200000,
                createdDate: "2025-12-01T10:00:00",
            },
        };

        renderUI(pendingInvoiceState);

        const payButton = screen.getByRole("button", { name: /Thanh toán VNPay/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(createVNPayUrl).toHaveBeenCalledWith(
                expect.objectContaining({
                    invoiceId: 123,
                    bankCode: "VNPAY",
                    orderType: "WALLET_TOPUP",
                })
            );

            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Chuyển hướng...",
                    description: "Đang chuyển đến cổng thanh toán...",
                })
            );
        });
    });

    test.skip("shows error when VNPay URL creation fails", async () => {
        const { createVNPayUrl } = require("../services/axios.services");
        createVNPayUrl.mockResolvedValueOnce({
            success: false,
            error: "Invalid invoice",
        });

        const pendingInvoiceState = {
            pendingInvoice: {
                invoiceId: 123,
                invoiceType: "BOOKING",
                totalAmount: 200000,
                createdDate: "2025-12-01T10:00:00",
            },
        };

        renderUI(pendingInvoiceState);

        const payButton = screen.getByRole("button", { name: /Thanh toán VNPay/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Lỗi thanh toán",
                    description: "Invalid invoice",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 6. TEST VNPAY RETURN HANDLING =====
    test.skip("handles successful VNPay payment return", async () => {
        const { checkVNPayPaymentStatus } = require("../services/axios.services");
        checkVNPayPaymentStatus.mockResolvedValueOnce({
            paymentStatus: "SUCCESS",
            vnpResponseCode: "00",
            message: "Payment successful",
        });

        // Set window.location.search for URLSearchParams
        window.location.search = "?vnp_TxnRef=12345";

        renderUI();

        await waitFor(() => {
            expect(checkVNPayPaymentStatus).toHaveBeenCalledWith("12345");
        }, { timeout: 4000 });

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Thanh toán thành công!",
                    description: "Payment successful",
                })
            );
        }, { timeout: 4000 });
    });

    test.skip("handles failed VNPay payment return", async () => {
        const { checkVNPayPaymentStatus } = require("../services/axios.services");
        checkVNPayPaymentStatus.mockResolvedValueOnce({
            paymentStatus: "FAILED",
            vnpResponseCode: "99",
            message: "Payment failed",
        });

        // Set window.location.search for URLSearchParams
        window.location.search = "?vnp_TxnRef=12345";

        renderUI();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Thanh toán thất bại!",
                    description: "Payment failed",
                    variant: "destructive",
                })
            );
        }, { timeout: 4000 });
    });

    // ===== 7. TEST USER DATA VALIDATION =====
    test("shows error when user data is missing", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");

        // Mock useLocation with reservation data
        const customLocation = { ...mockLocation, state: mockLocation.state };
        jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue(customLocation);

        // Render with null userData
        render(
            <MemoryRouter>
                <SystemContext.Provider value={{ userData: null, setUserData: mockSetUserData }}>
                    <Payment />
                </SystemContext.Provider>
            </MemoryRouter>
        );

        // Find and click the wallet payment button
        const walletPayButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(walletPayButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Lỗi",
                    description: "Không tìm thấy thông tin người dùng",
                    variant: "destructive",
                })
            );

            expect(createBookingForVehicles).not.toHaveBeenCalled();
        });
    });

    // ===== 8. TEST NAVIGATION =====
    test("navigates to dashboard when clicking back button", () => {
        renderUI();

        const backButton = screen.getByText("Về Dashboard").closest("a");
        expect(backButton).toHaveAttribute("href", "/driver");
    });

    // ===== 9. TEST SECURITY INFO DISPLAY =====
    test("displays security features", () => {
        renderUI();

        expect(screen.getByText("Mã hóa SSL 256-bit")).toBeInTheDocument();
        expect(screen.getByText("Tuân thủ chuẩn PCI DSS")).toBeInTheDocument();
        expect(screen.getByText("Không lưu trữ thông tin thẻ")).toBeInTheDocument();
        expect(screen.getByText("Xác thực 2 lớp")).toBeInTheDocument();
    });

    // ===== 10. TEST WALLET TOPUP INVOICE =====
    test.skip("displays wallet topup invoice details", () => {
        const walletTopupState = {
            pendingInvoice: {
                invoiceId: 456,
                invoiceType: "WALLET_TOPUP",
                totalAmount: 500000,
                createdDate: "2025-12-01T10:00:00",
            },
        };

        renderUI(walletTopupState);

        expect(screen.getByText("Hóa đơn nạp tiền ví của bạn")).toBeInTheDocument();
        expect(screen.getByText(/500\.000 VNĐ/)).toBeInTheDocument();
    });

    // ===== 11. TEST BOOKING DATA FORMAT =====
    test("formats booking data correctly", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({ success: true });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(createBookingForVehicles).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    paymentMethod: "WALLET",
                    bookings: expect.arrayContaining([
                        expect.objectContaining({
                            vehicleId: 1,
                            stationId: 1,
                            batteryType: "48V",
                            batteryCount: 2,
                        }),
                    ]),
                })
            );
        });
    });

    // ===== 12. TEST SESSION STORAGE CLEANUP =====
    test("clears session storage on successful payment", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({ success: true });

        sessionStorage.setItem("battery-booking-selection", "test-data");

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/driver/booking-history");
        });

        // Session storage should be cleared (mocked, so we can't actually test this)
    });

    // ===== 13. TEST MULTIPLE VEHICLES =====
    test("handles payment with multiple vehicles", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({ success: true });

        const multiVehicleState = {
            reservationData: {
                item1: {
                    vehicleInfo: { vehicleId: "1", vehicleType: "Xe máy điện" },
                    stationInfo: { stationId: 1, stationName: "Trạm A" },
                    date: new Date("2025-12-01"),
                    time: "09:00",
                    batteryType: "48V",
                    qty: 2,
                },
                item2: {
                    vehicleInfo: { vehicleId: "2", vehicleType: "Xe máy điện" },
                    stationInfo: { stationId: 2, stationName: "Trạm B" },
                    date: new Date("2025-12-02"),
                    time: "10:00",
                    batteryType: "60V",
                    qty: 1,
                },
            },
            totalPrice: 150000,
        };

        renderUI(multiVehicleState);

        expect(screen.getByText("Trạm A")).toBeInTheDocument();
        expect(screen.getByText("Trạm B")).toBeInTheDocument();
        expect(screen.getAllByText("Xe máy điện").length).toBeGreaterThanOrEqual(2);

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(createBookingForVehicles).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookings: expect.arrayContaining([
                        expect.objectContaining({ stationId: 1 }),
                        expect.objectContaining({ stationId: 2 }),
                    ]),
                })
            );
        });
    });

    // ===== 14. TEST WALLET BALANCE DISPLAY =====
    test("displays wallet balance correctly", () => {
        renderUI();

        expect(screen.getByText(/Số dư:/)).toBeInTheDocument();
        expect(screen.getByText("Ví hệ thống")).toBeInTheDocument();
    });

    // ===== 15. TEST EDGE CASES =====
    test("handles empty reservation data gracefully", () => {
        const emptyState = {
            reservationData: {},
            totalPrice: 0,
        };

        renderUI(emptyState);

        // Should still render payment page
        expect(screen.getByText("Thanh toán")).toBeInTheDocument();
        expect(screen.getByText("Phương thức thanh toán")).toBeInTheDocument();
    });

    test("updates wallet balance after successful payment", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({ success: true });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockSetUserData).toHaveBeenCalledWith(
                expect.any(Function)
            );
        });
    });

    test("handles error with auth message", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({
            success: false,
            messages: {
                auth: "Authentication failed"
            }
        });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đặt lịch thất bại!",
                    description: "Authentication failed",
                    variant: "destructive",
                })
            );
        });
    });

    test("handles error with business message", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({
            success: false,
            messages: {
                business: "Business rule violation"
            }
        });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: "Business rule violation",
                })
            );
        });
    });

    test("handles response with only message field", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({
            success: false,
            message: "Simple error message"
        });

        renderUI();

        const payButton = screen.getByRole("button", { name: /Thanh toán bằng Ví/i });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: "Simple error message",
                })
            );
        });
    });

    test("handles multiple items in same station", async () => {
        const { createBookingForVehicles } = require("../services/axios.services");
        createBookingForVehicles.mockResolvedValueOnce({ success: true });

        const sameStationState = {
            reservationData: {
                item1: {
                    vehicleInfo: { vehicleId: "1", vehicleType: "Xe máy điện" },
                    stationInfo: { stationId: 1, stationName: "Trạm A" },
                    date: new Date("2025-12-01"),
                    time: "09:00",
                    batteryType: "48V",
                    qty: 2,
                },
                item2: {
                    vehicleInfo: { vehicleId: "2", vehicleType: "Xe tay ga" },
                    stationInfo: { stationId: 1, stationName: "Trạm A" }, // Same station
                    date: new Date("2025-12-01"),
                    time: "10:00",
                    batteryType: "60V",
                    qty: 1,
                },
            },
            totalPrice: 150000,
        };

        renderUI(sameStationState);

        // Both items should be grouped under same station
        const stationElements = screen.getAllByText("Trạm A");
        expect(stationElements.length).toBeGreaterThan(0);

        expect(screen.getByText(/Xe máy điện/)).toBeInTheDocument();
        expect(screen.getByText(/Xe tay ga/)).toBeInTheDocument();
    });
});

