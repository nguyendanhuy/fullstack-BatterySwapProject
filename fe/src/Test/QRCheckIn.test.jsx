import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QRCheckIn from "../pages/staff/QRCheckIn";
import { SystemContext } from "../contexts/system.context";
import * as axiosServices from "../services/axios.services";
import { BrowserQRCodeReader } from "@zxing/browser";

jest.mock("../hooks/use-toast", () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

jest.mock("@zxing/browser");

jest.mock("../services/axios.services", () => ({
    verifyQrBooking: jest.fn(),
    checkBatteryModule: jest.fn(),
    commitSwap: jest.fn(),
    cancelBooking: jest.fn(),
    createInspectionAndDispute: jest.fn(),
}));

jest.mock("antd", () => ({
    ...jest.requireActual("antd"),
    Upload: ({ children, beforeUpload, disabled }) => (
        <div data-testid="upload-wrapper">
            <div
                data-testid="upload-btn"
                onClick={() => {
                    if (!disabled) {
                        const file = new File(["qr"], "qr.png", { type: "image/png" });
                        beforeUpload(file);
                    }
                }}
            >
                {children}
            </div>
        </div>
    ),
    Popconfirm: ({ children, onConfirm, disabled }) => (
        <div
            data-testid="popconfirm"
            onClick={() => !disabled && onConfirm && onConfirm()}
        >
            {children}
        </div>
    ),
    Space: ({ children }) => <div data-testid="space">{children}</div>,
    Divider: () => <div data-testid="divider" />,
}));

global.URL.createObjectURL = jest.fn(() => "blob:preview");
global.URL.revokeObjectURL = jest.fn();

const mockUserData = {
    userId: "staff-001",
    userName: "Staff Test",
};

const mockToast = jest.fn();
jest.mock("../hooks/use-toast", () => ({
    useToast: () => ({ toast: mockToast }),
}));

const mockDecode = jest.fn();
BrowserQRCodeReader.mockImplementation(() => ({
    decodeFromImageUrl: mockDecode,
}));

const mockVerify = axiosServices.verifyQrBooking;
const mockCheckBattery = axiosServices.checkBatteryModule;
const mockCommitSwap = axiosServices.commitSwap;
const mockCancelBooking = axiosServices.cancelBooking;
const mockCreateInspection = axiosServices.createInspectionAndDispute;

const renderWithCtx = () => {
    return render(
        <SystemContext.Provider value={{ userData: mockUserData }}>
            <QRCheckIn />
        </SystemContext.Provider>
    );
};

describe("QRCheckIn - Test Coverage >80%", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockToast.mockClear();
    });

    // ==================== UI RENDERING ====================
    describe("UI Rendering Tests", () => {
        it("hiển thị tiêu đề trang chính", () => {
            renderWithCtx();
            expect(screen.getByText("Quét QR thông minh")).toBeInTheDocument();
        });

        it("hiển thị card quét QR với title", () => {
            renderWithCtx();
            expect(screen.getByText("Quét QR Code khách hàng")).toBeInTheDocument();
        });

        it("hiển thị mô tả card quét QR", () => {
            renderWithCtx();
            expect(
                screen.getByText(/Quét mã QR của khách hàng để xác nhận đặt lịch/i)
            ).toBeInTheDocument();
        });

        it("hiển thị placeholder khi chưa quét QR", () => {
            renderWithCtx();
            expect(screen.getByText("Sẵn sàng quét QR Code")).toBeInTheDocument();
        });

        it("hiển thị card hướng dẫn sử dụng", () => {
            renderWithCtx();
            expect(screen.getByText("Hướng dẫn sử dụng")).toBeInTheDocument();
        });

        it("hiển thị 5 bước hướng dẫn", () => {
            renderWithCtx();
            expect(screen.getByText(/Yêu cầu khách hàng mở ứng dụng/i)).toBeInTheDocument();
            expect(screen.getByText(/Khách hàng hiển thị QR code/i)).toBeInTheDocument();
            expect(screen.getByText(/Nhấn 'Bắt đầu quét QR'/i)).toBeInTheDocument();
            expect(screen.getByText(/Đưa camera về phía QR code/i)).toBeInTheDocument();
            expect(screen.getByText(/Hệ thống sẽ tự động xác nhận/i)).toBeInTheDocument();
        });

        it("hiển thị placeholder thông tin khách hàng khi chưa quét", () => {
            renderWithCtx();
            expect(screen.getByText("Chờ quét QR Code")).toBeInTheDocument();
            expect(
                screen.getByText(/Thông tin khách hàng sẽ hiển thị sau khi quét thành công/i)
            ).toBeInTheDocument();
        });

        it("hiển thị nút Upload QR", () => {
            renderWithCtx();
            expect(screen.getByText("Upload QR")).toBeInTheDocument();
        });

        it("hiển thị nút Bắt đầu quét QR", () => {
            renderWithCtx();
            expect(screen.getByText("Bắt đầu quét QR")).toBeInTheDocument();
        });

        it("hiển thị gợi ý định dạng file", () => {
            renderWithCtx();
            expect(
                screen.getByText(/Hỗ trợ JPG, PNG, WEBP/i)
            ).toBeInTheDocument();
        });
    });

    // ==================== STATE MANAGEMENT ====================
    describe("State Management Tests", () => {
        it("khởi tạo với state ban đầu là null cho scannedCustomer", () => {
            renderWithCtx();
            expect(screen.getByText("Chờ quét QR Code")).toBeInTheDocument();
        });

        it("cập nhật previewUrl khi upload ảnh thành công", async () => {
            mockDecode.mockResolvedValueOnce({ getText: () => "QR123" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));

            await waitFor(() => {
                const preview = screen.getByAltText("QR preview");
                expect(preview).toBeInTheDocument();
                expect(preview).toHaveAttribute("src", "blob:preview");
            });
        });

        it("reset previewUrl khi click nút xóa ảnh", async () => {
            mockDecode.mockResolvedValueOnce({ getText: () => "QR123" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(screen.getByAltText("QR preview")).toBeInTheDocument());

            fireEvent.click(screen.getByText("Xóa ảnh"));

            await waitFor(() => {
                expect(screen.queryByAltText("QR preview")).not.toBeInTheDocument();
                expect(screen.getByText("Sẵn sàng quét QR Code")).toBeInTheDocument();
            });
        });

        it("hiển thị error khi decode QR thất bại", async () => {
            mockDecode.mockRejectedValueOnce(new Error("No QR found"));
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));

            await waitFor(() => {
                expect(screen.getByText(/Không phát hiện QR/i)).toBeInTheDocument();
            });
        });

        it("xóa error khi xóa ảnh preview", async () => {
            mockDecode.mockRejectedValueOnce(new Error("No QR"));
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(screen.getByText(/Không phát hiện QR/i)).toBeInTheDocument());

            // Upload lại thành công
            mockDecode.mockResolvedValueOnce({ getText: () => "QR" });
            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(screen.getByAltText("QR preview")).toBeInTheDocument());

            fireEvent.click(screen.getByText("Xóa ảnh"));

            await waitFor(() => {
                expect(screen.queryByText(/Không phát hiện QR/i)).not.toBeInTheDocument();
            });
        });
    });

    // ==================== EVENTS ====================
    describe("Event Handling Tests", () => {
        it("gọi decode khi upload ảnh", async () => {
            mockDecode.mockResolvedValueOnce({ getText: () => "QR123" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));

            await waitFor(() => {
                expect(mockDecode).toHaveBeenCalledWith("blob:preview");
            });
        });

        it("gọi URL.createObjectURL khi upload ảnh", async () => {
            mockDecode.mockResolvedValueOnce({ getText: () => "QR123" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));

            await waitFor(() => {
                expect(global.URL.createObjectURL).toHaveBeenCalled();
            });
        });

        it("gọi URL.revokeObjectURL khi xóa ảnh", async () => {
            mockDecode.mockResolvedValueOnce({ getText: () => "QR123" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(screen.getByAltText("QR preview")).toBeInTheDocument());

            fireEvent.click(screen.getByText("Xóa ảnh"));

            await waitFor(() => {
                expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
            });
        });

        it("upload nhiều lần liên tiếp", async () => {
            mockDecode.mockResolvedValue({ getText: () => "QR" });
            renderWithCtx();

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(mockDecode).toHaveBeenCalledTimes(1));

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(mockDecode).toHaveBeenCalledTimes(2));

            fireEvent.click(screen.getByTestId("upload-btn"));
            await waitFor(() => expect(mockDecode).toHaveBeenCalledTimes(3));
        });
    });

    // ==================== API CALLS - verifyQrBooking ====================
    describe("API - verifyQrBooking Tests", () => {
        it("gọi verifyQrBooking khi click Bắt đầu quét QR thành công", async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();

            const scanBtn = screen.getByText("Bắt đầu quét QR");
            fireEvent.click(scanBtn);

            await waitFor(() => {
                expect(mockVerify).toHaveBeenCalled();
            });
        });

        it("hiển thị thông tin khách hàng sau khi verify thành công", async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();

            fireEvent.click(screen.getByText("Bắt đầu quét QR"));

            await waitFor(() => {
                expect(screen.getByText("Check-in thành công!")).toBeInTheDocument();
                expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
                expect(screen.getByText("0123456789")).toBeInTheDocument();
                expect(screen.getByText("VF 8")).toBeInTheDocument();
                expect(screen.getByText("VIN123")).toBeInTheDocument();
            });
        });

        it("hiển thị toast khi verify QR thành công nhưng có lỗi", async () => {
            mockVerify.mockResolvedValueOnce({
                success: false,
                error: true,
                message: "QR không hợp lệ",
            });

            renderWithCtx();

            fireEvent.click(screen.getByText("Bắt đầu quét QR"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi đọc QR Code",
                        variant: "destructive",
                    })
                );
            });
        });

        it("hiển thị toast khi verify QR lỗi mạng", async () => {
            mockVerify.mockRejectedValueOnce(new Error("Network error"));

            renderWithCtx();

            fireEvent.click(screen.getByText("Bắt đầu quét QR"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi mạng khi đọc QR Code",
                    })
                );
            });
        });
    });

    // ==================== API CALLS - checkBatteryModule ====================
    describe("API - checkBatteryModule Tests", () => {
        const setupWithCustomer = async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();
            fireEvent.click(screen.getByText("Bắt đầu quét QR"));
            await waitFor(() => expect(screen.getByText("Check-in thành công!")).toBeInTheDocument());
        };

        it("hiển thị lỗi khi xác thực pin với ID trống", async () => {
            await setupWithCustomer();

            const verifyBtn = screen.getByText("Xác nhận");
            fireEvent.click(verifyBtn);

            await waitFor(() => {
                expect(screen.getByText(/Vui lòng nhập.*ID pin/i)).toBeInTheDocument();
            });
        });

        it("xóa lỗi validation khi nhập ID pin", async () => {
            await setupWithCustomer();

            const verifyBtn = screen.getByText("Xác nhận");
            fireEvent.click(verifyBtn);

            await waitFor(() => expect(screen.getByText(/Vui lòng nhập.*ID pin/i)).toBeInTheDocument());

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            await waitFor(() => {
                expect(screen.queryByText(/Vui lòng nhập.*ID pin/i)).not.toBeInTheDocument();
            });
        });

        it("hiển thị lỗi khi ID pin không hợp lệ", async () => {
            await setupWithCustomer();

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT@@#" } });

            const verifyBtn = screen.getByText("Xác nhận");
            fireEvent.click(verifyBtn);

            await waitFor(() => {
                expect(screen.getByText(/Mã pin không hợp lệ/i)).toBeInTheDocument();
            });
        });

        it("gọi checkBatteryModule với ID pin hợp lệ", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockResolvedValueOnce({ success: true, message: "OK" });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            const verifyBtn = screen.getByText("Xác nhận");
            fireEvent.click(verifyBtn);

            await waitFor(() => {
                expect(mockCheckBattery).toHaveBeenCalledWith({
                    bookingId: 999,
                    batteryIds: ["BAT001"],
                });
            });
        });

        it("hiển thị toast thành công khi xác thực pin OK", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockResolvedValueOnce({ success: true, message: "Pin hợp lệ" });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText("Xác nhận"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Xác thực pin thành công",
                    })
                );
            });
        });

        it("hiển thị lỗi khi xác thực pin thất bại", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockResolvedValueOnce({ success: false, message: "Pin không tồn tại" });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT999" } });

            fireEvent.click(screen.getByText("Xác nhận"));

            await waitFor(() => {
                expect(screen.getByText(/Pin không tồn tại/i)).toBeInTheDocument();
            });
        });

        it("xử lý lỗi mạng khi xác thực pin", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockRejectedValueOnce(new Error("Network error"));

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText("Xác nhận"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi mạng khi xác thực pin",
                    })
                );
            });
        });

        it("xử lý nhiều ID pin cách nhau bằng khoảng trắng", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockResolvedValueOnce({ success: true });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001 BAT002 BAT003" } });

            fireEvent.click(screen.getByText("Xác nhận"));

            await waitFor(() => {
                expect(mockCheckBattery).toHaveBeenCalledWith(
                    expect.objectContaining({
                        batteryIds: ["BAT001", "BAT002", "BAT003"],
                    })
                );
            });
        });

        it("chuyển ID pin chữ thường thành in hoa", async () => {
            await setupWithCustomer();
            mockCheckBattery.mockResolvedValueOnce({ success: true });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "bat001" } });

            fireEvent.click(screen.getByText("Xác nhận"));

            await waitFor(() => {
                expect(mockCheckBattery).toHaveBeenCalledWith(
                    expect.objectContaining({
                        batteryIds: ["BAT001"],
                    })
                );
            });
        });
    });

    // ==================== API CALLS - commitSwap ====================
    describe("API - commitSwap Tests", () => {
        const setupWithCustomer = async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();
            fireEvent.click(screen.getByText("Bắt đầu quét QR"));
            await waitFor(() => expect(screen.getByText("Check-in thành công!")).toBeInTheDocument());
        };

        it("button bắt đầu dịch vụ bị disabled khi ID pin trống", async () => {
            await setupWithCustomer();

            const startBtn = screen.getByText(/Bắt đầu dịch vụ đổi pin/i);

            expect(startBtn).toBeDisabled();
        });

        it("gọi commitSwap khi bắt đầu dịch vụ thành công", async () => {
            await setupWithCustomer();
            mockCommitSwap.mockResolvedValueOnce({
                success: true,
                message: "OK",
                data: [{ dockOutSlot: 5 }],
            });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText(/Bắt đầu dịch vụ đổi pin/i));

            await waitFor(() => {
                expect(mockCommitSwap).toHaveBeenCalledWith({
                    bookingId: 999,
                    batteryInIds: ["BAT001"],
                    staffUserId: "staff-001",
                });
            });
        });

        it("hiển thị dialog slot pin sau khi commit thành công", async () => {
            await setupWithCustomer();
            mockCommitSwap.mockResolvedValueOnce({
                success: true,
                message: "Đã mở ô pin",
                data: [{ dockOutSlot: 5 }, { dockOutSlot: 12 }],
            });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001 BAT002" } });

            fireEvent.click(screen.getByText(/Bắt đầu dịch vụ đổi pin/i));

            await waitFor(() => {
                expect(screen.getByRole("dialog")).toBeInTheDocument();
                const dialogText = screen.getByRole("dialog").textContent;
                expect(dialogText).toMatch(/ô pin đang mở/i);
                expect(dialogText).toContain("5");
                expect(dialogText).toContain("12");
            });
        });

        it("đóng dialog slot pin và reset state", async () => {
            await setupWithCustomer();
            mockCommitSwap.mockResolvedValueOnce({
                success: true,
                data: [{ dockOutSlot: 3 }],
            });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText(/Bắt đầu dịch vụ đổi pin/i));

            await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

            fireEvent.click(screen.getByText("Đã hiểu"));

            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
                expect(screen.getByText("Chờ quét QR Code")).toBeInTheDocument();
            });
        });

        it("hiển thị lỗi khi commitSwap thất bại", async () => {
            await setupWithCustomer();
            mockCommitSwap.mockResolvedValueOnce({ success: false, message: "Lỗi hệ thống" });

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText(/Bắt đầu dịch vụ đổi pin/i));

            await waitFor(() => {
                expect(screen.getByText(/Lỗi hệ thống/i)).toBeInTheDocument();
            });
        });

        it("xử lý lỗi mạng khi commitSwap", async () => {
            await setupWithCustomer();
            mockCommitSwap.mockRejectedValueOnce(new Error("Network"));

            const input = screen.getByPlaceholderText(/Nhập ID pin/i);
            fireEvent.change(input, { target: { value: "BAT001" } });

            fireEvent.click(screen.getByText(/Bắt đầu dịch vụ đổi pin/i));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi mạng khi tải QR Code",
                    })
                );
            });
        });
    });

    // ==================== API CALLS - cancelBooking ====================
    describe("API - cancelBooking Tests", () => {
        const setupWithCustomer = async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();
            fireEvent.click(screen.getByText("Bắt đầu quét QR"));
            await waitFor(() => expect(screen.getByText("Check-in thành công!")).toBeInTheDocument());
        };

        it("gọi cancelBooking khi click hủy booking", async () => {
            await setupWithCustomer();
            mockCancelBooking.mockResolvedValueOnce({ success: true, message: "Đã hủy" });

            const cancelWrapper = screen.getByTestId("popconfirm");
            fireEvent.click(cancelWrapper);

            await waitFor(() => {
                expect(mockCancelBooking).toHaveBeenCalledWith({
                    bookingId: 999,
                    cancelType: "PERMANENT",
                });
            });
        });

        it("hiển thị toast thành công khi hủy booking", async () => {
            await setupWithCustomer();
            mockCancelBooking.mockResolvedValueOnce({ success: true, message: "Đã hủy" });

            fireEvent.click(screen.getByTestId("popconfirm"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đã hủy đặt lịch",
                    })
                );
            });
        });

        it("reset state sau khi hủy booking thành công", async () => {
            await setupWithCustomer();
            mockCancelBooking.mockResolvedValueOnce({ success: true });

            fireEvent.click(screen.getByTestId("popconfirm"));

            await waitFor(() => {
                expect(screen.getByText("Chờ quét QR Code")).toBeInTheDocument();
            });
        });

        it("hiển thị toast lỗi khi hủy booking thất bại", async () => {
            await setupWithCustomer();
            mockCancelBooking.mockResolvedValueOnce({ success: false });

            fireEvent.click(screen.getByTestId("popconfirm"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Hủy thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("xử lý lỗi mạng khi hủy booking", async () => {
            await setupWithCustomer();
            mockCancelBooking.mockRejectedValueOnce(new Error("Network"));

            fireEvent.click(screen.getByTestId("popconfirm"));

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi mạng khi hủy booking",
                    })
                );
            });
        });
    });

    // ==================== API CALLS - createInspectionAndDispute ====================
    describe("API - createInspectionAndDispute Tests", () => {
        const setupWithCustomer = async () => {
            mockVerify.mockResolvedValueOnce({
                success: true,
                data: {
                    bookingId: 999,
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    vehicleType: "VF 8",
                    batteryType: "LITHIUM_ION",
                    vehicleVin: "VIN123",
                    batteryCount: 2,
                    bookingDate: "2025-12-01",
                    timeSlot: "14:00",
                    invoiceStatus: "ĐÃ THANH TOÁN",
                },
            });

            renderWithCtx();
            fireEvent.click(screen.getByText("Bắt đầu quét QR"));
            await waitFor(() => expect(screen.getByText("Check-in thành công!")).toBeInTheDocument());
        };

        it("mở dialog nhập trạng thái pin khi click nút", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const dialogs = screen.getAllByText(/Nhập trạng thái pin trả về/i);
                expect(dialogs.length).toBeGreaterThan(1);
            });
        });

        it("hiển thị các trường input trong dialog inspection", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                expect(screen.getByLabelText(/ID Pin trả về/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/Tình trạng sức khỏe pin/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/Ghi chú về tình trạng vật lý/i)).toBeInTheDocument();
            });
        });

        it("hiển thị lỗi khi submit thiếu battery ID", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const saveBtn = screen.getByText(/Lưu thông tin/i);
                fireEvent.click(saveBtn);
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: "Vui lòng nhập ID pin trả về",
                    })
                );
            });
        });

        it("hiển thị lỗi khi SOH không hợp lệ (âm)", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "BAT001" } });

                const sohInput = screen.getByLabelText(/Tình trạng sức khỏe pin/i);
                fireEvent.change(sohInput, { target: { value: "-10" } });

                fireEvent.click(screen.getByText(/Lưu thông tin/i));
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: "State of Health phải từ 0-100",
                    })
                );
            });
        });

        it("hiển thị lỗi khi SOH > 100", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "BAT001" } });

                const sohInput = screen.getByLabelText(/Tình trạng sức khỏe pin/i);
                fireEvent.change(sohInput, { target: { value: "150" } });

                fireEvent.click(screen.getByText(/Lưu thông tin/i));
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: "State of Health phải từ 0-100",
                    })
                );
            });
        });

        it("gọi createInspectionAndDispute khi submit thành công", async () => {
            await setupWithCustomer();
            mockCreateInspection.mockResolvedValueOnce({ success: true });

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "BAT001" } });

                const sohInput = screen.getByLabelText(/Tình trạng sức khỏe pin/i);
                fireEvent.change(sohInput, { target: { value: "85" } });

                fireEvent.click(screen.getByText(/Lưu thông tin/i));
            });

            await waitFor(() => {
                expect(mockCreateInspection).toHaveBeenCalledWith(
                    expect.objectContaining({
                        batteryInId: "BAT001",
                        bookingId: 999,
                        stateOfHealth: 85,
                        staffId: "staff-001",
                    })
                );
            });
        });

        it("đóng dialog và reset form sau khi submit thành công", async () => {
            await setupWithCustomer();
            mockCreateInspection.mockResolvedValueOnce({ success: true });

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "BAT001" } });

                const sohInput = screen.getByLabelText(/Tình trạng sức khỏe pin/i);
                fireEvent.change(sohInput, { target: { value: "85" } });

                fireEvent.click(screen.getByText(/Lưu thông tin/i));
            });

            await waitFor(() => {
                const dialogs = screen.queryAllByText(/Nhập trạng thái pin trả về/i);
                expect(dialogs.length).toBe(1);
            });
        });

        it("xử lý lỗi khi createInspection thất bại", async () => {
            await setupWithCustomer();
            mockCreateInspection.mockRejectedValueOnce(new Error("API Error"));

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "BAT001" } });

                const sohInput = screen.getByLabelText(/Tình trạng sức khỏe pin/i);
                fireEvent.change(sohInput, { target: { value: "50" } });

                fireEvent.click(screen.getByText(/Lưu thông tin/i));
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Lỗi",
                        variant: "destructive",
                    })
                );
            });
        });

        it("đóng dialog bằng nút Hủy và reset form", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                fireEvent.change(batteryInput, { target: { value: "TEST123" } });

                fireEvent.click(screen.getByText("Hủy"));
            });

            // Mở lại dialog
            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                const batteryInput = screen.getByLabelText(/ID Pin trả về/i);
                expect(batteryInput.value).toBe("");
            });
        });

        it("hiển thị switch tạo tranh chấp", async () => {
            await setupWithCustomer();

            fireEvent.click(screen.getByText(/Nhập trạng thái pin trả về/i));

            await waitFor(() => {
                expect(screen.getByLabelText(/Tạo tranh chấp/i)).toBeInTheDocument();
            });
        });
    });
});
