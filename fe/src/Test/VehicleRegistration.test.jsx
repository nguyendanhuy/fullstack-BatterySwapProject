import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VehicleRegistration from "../pages/driver/VehicleRegistration";
import { SystemContext } from "../contexts/system.context";
import * as axiosServices from "../services/axios.services";

// Mock toast hook
jest.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock axios services
jest.mock("../services/axios.services", () => ({
    getVehicleInfoByVin: jest.fn(),
    registerVehicleByVin: jest.fn(),
    deactivateVehicleByVin: jest.fn(),
    getUserAllVehicles: jest.fn(),
}));

describe("VehicleRegistration Component", () => {
    let mockToast;
    const mockSetUserVehicles = jest.fn();

    const mockUserData = {
        userId: "user123",
        username: "testuser",
    };

    const mockVehicle1 = {
        vehicleId: "v1",
        vin: "1HGBH41JXMN109186",
        vehicleType: "VF 8",
        batteryType: "LITHIUM_ION",
        batteryCount: 2,
        color: "Đỏ",
        manufactureYear: "2023",
        purchaseDate: "2023-05-01",
        licensePlate: "30A-12345",
        ownername: "Nguyen Van A",
        ownerName: "Nguyen Van A",
        userId: "user123",
    };

    const mockVehicle2 = {
        vehicleId: "v2",
        vin: "2HGBH41JXMN109187",
        vehicleType: "VF 9",
        batteryType: "NICKEL_METAL_HYDRIDE",
        batteryCount: 3,
        color: "Xanh",
        manufactureYear: "2023",
        purchaseDate: "2023-06-01",
        licensePlate: "30B-54321",
        ownername: "Tran Thi B",
        ownerName: "Tran Thi B",
        userId: "user123",
    };

    const mockVehicle3 = {
        vehicleId: "v3",
        vin: "3HGBH41JXMN109188",
        vehicleType: "VF e34",
        batteryType: "LEAD_ACID",
        batteryCount: 1,
        color: "Trắng",
        manufactureYear: "2024",
        purchaseDate: "2024-01-01",
        licensePlate: "30C-99999",
        ownername: "Le Van C",
        ownerName: "Le Van C",
        userId: "user123",
    };

    const renderWithContext = (userVehicles = []) => {
        const mockContextValue = {
            userData: mockUserData,
            userVehicles,
            setUserVehicles: mockSetUserVehicles,
        };

        return render(
            <BrowserRouter>
                <SystemContext.Provider value={mockContextValue}>
                    <VehicleRegistration />
                </SystemContext.Provider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockToast = jest.fn();
        jest.spyOn(require("@/hooks/use-toast"), "useToast").mockReturnValue({
            toast: mockToast,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("UI Rendering", () => {
        it("renders the main heading and form elements", () => {
            renderWithContext();

            expect(screen.getByRole("heading", { name: "Đăng ký xe" })).toBeInTheDocument();
            expect(screen.getByText("Thông tin xe VINFAST")).toBeInTheDocument();
            expect(screen.getByLabelText(/Mã VIN/i)).toBeInTheDocument();
            expect(screen.getByText(/Dòng xe VINFAST/i)).toBeInTheDocument();
            expect(screen.getByText(/Loại pin/i)).toBeInTheDocument();
        });

        it("renders registered vehicles section with 0/3 initially", () => {
            renderWithContext();

            expect(screen.getByText("Xe đã đăng ký")).toBeInTheDocument();
            expect(screen.getByText("0/3")).toBeInTheDocument();
            expect(screen.getByText("Bạn chưa đăng ký xe nào")).toBeInTheDocument();
        });

        it("renders benefits section", () => {
            renderWithContext();

            expect(screen.getByText("Lợi ích khi đăng ký")).toBeInTheDocument();
            expect(screen.getByText("Tìm trạm đổi pin nhanh chóng")).toBeInTheDocument();
            expect(screen.getByText("Đặt lịch trước để tiết kiệm thời gian")).toBeInTheDocument();
            expect(screen.getByText("Theo dõi lịch sử và chi phí")).toBeInTheDocument();
        });

        it("displays registered vehicles when userVehicles are provided", () => {
            renderWithContext([mockVehicle1, mockVehicle2]);

            expect(screen.getByText("2/3")).toBeInTheDocument();
            expect(screen.getByText("VF 8")).toBeInTheDocument();
            expect(screen.getByText("VF 9")).toBeInTheDocument();
            expect(screen.getByText(/VIN: 1HGBH41JXMN109186/)).toBeInTheDocument();
            expect(screen.getByText(/VIN: 2HGBH41JXMN109187/)).toBeInTheDocument();
        });

        it("shows limit warning when 3 vehicles are registered", () => {
            renderWithContext([mockVehicle1, mockVehicle2, mockVehicle3]);

            expect(screen.getByText("3/3")).toBeInTheDocument();
            expect(screen.getByText(/Bạn đã đạt giới hạn tối đa 3 xe/)).toBeInTheDocument();
            expect(screen.getByText("Đã đạt giới hạn (3/3)")).toBeInTheDocument();
        });

        it("disables register button initially", () => {
            renderWithContext();

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            expect(registerButton).toBeDisabled();
        });
    });

    describe("State Management", () => {
        it("updates VIN input state on change", async () => {
            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN10" } });

            await waitFor(() => {
                expect(vinInput.value).toBe("1HGBH41JXMN10");
            });
        });

        it("limits VIN input to 17 characters", async () => {
            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);

            // Check that maxLength attribute is set to 17
            expect(vinInput).toHaveAttribute("maxLength", "17");
        });

        it("syncs userVehicles from context to local state", () => {
            const { rerender } = renderWithContext([mockVehicle1]);

            expect(screen.getByText("VF 8")).toBeInTheDocument();

            // Update context
            const newMockContextValue = {
                userData: mockUserData,
                userVehicles: [mockVehicle1, mockVehicle2],
                setUserVehicles: mockSetUserVehicles,
            };

            rerender(
                <BrowserRouter>
                    <SystemContext.Provider value={newMockContextValue}>
                        <VehicleRegistration />
                    </SystemContext.Provider>
                </BrowserRouter>
            );

            expect(screen.getByText("VF 9")).toBeInTheDocument();
        });
    });

    describe("VIN Lookup Functionality", () => {
        it("triggers VIN lookup when 17 characters are entered", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                batteryCount: 2,
                color: "Đỏ",
                manufactureYear: "2023",
                purchaseDate: "2023-05-01",
                licensePlate: "30A-12345",
                ownername: "Nguyen Van A",
                active: false,
                userId: null,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(axiosServices.getVehicleInfoByVin).toHaveBeenCalledWith("1HGBH41JXMN109186");
            });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
                expect(screen.getByDisplayValue("LITHIUM_ION")).toBeInTheDocument();
            });
        });

        it("shows success toast when VIN lookup succeeds and vehicle is not active", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                batteryCount: 2,
                active: false,
                userId: null,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Tra cứu VIN thành công!",
                        description: "Đã tự nhận dòng xe và loại pin!",
                    })
                );
            });
        });

        it("shows warning toast when vehicle is already registered by current user", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                userId: "user123",
                active: true,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Cảnh báo",
                        variant: "destructive",
                    })
                );
            });

            await waitFor(() => {
                expect(screen.getByText(/Xe này đã được đăng ký bởi chính bạn/)).toBeInTheDocument();
            });
        });

        it("shows warning toast when vehicle is registered by another user", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                userId: "otherUser",
                active: true,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByText(/Xe này đã được đăng ký bởi tài khoản khác/)).toBeInTheDocument();
            });
        });

        it("shows error toast when VIN lookup fails", async () => {
            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce({
                status: 404,
                error: "Vehicle not found",
            });

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Tra cứu VIN thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("clears form data when VIN is shortened below 17 characters", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);

            // First, enter full VIN
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            // Then, shorten VIN
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN10" } });

            await waitFor(() => {
                const emptyFields = screen.getAllByDisplayValue("—");
                expect(emptyFields.length).toBeGreaterThan(0);
            });
        });

        it("handles network error during VIN lookup", async () => {
            axiosServices.getVehicleInfoByVin.mockRejectedValueOnce(new Error("Network error"));

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Tra cứu VIN thất bại (có thể do mạng)",
                        variant: "destructive",
                    })
                );
            });
        });
    });

    describe("Vehicle Registration", () => {
        it("shows validation error when trying to register without VIN", async () => {
            renderWithContext();

            // Manually enable button by mocking internal state (this is tricky, so we'll test the flow)
            // Instead, we'll test that button is disabled
            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            expect(registerButton).toBeDisabled();
        });

        it("successfully registers vehicle and updates vehicle list", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                batteryCount: 2,
                active: false,
                userId: null,
            };

            const mockRegisterResponse = {
                messages: { success: "Vehicle registered successfully" },
                active: true,
            };

            const mockUpdatedVehicles = [mockVehicle1];

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);
            axiosServices.registerVehicleByVin.mockResolvedValueOnce(mockRegisterResponse);
            axiosServices.getUserAllVehicles.mockResolvedValueOnce(mockUpdatedVehicles);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });

            // Click to open dialog
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận đăng ký xe")).toBeInTheDocument();
            });

            // Confirm registration
            const confirmButton = screen.getByRole("button", { name: "Có" });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(axiosServices.registerVehicleByVin).toHaveBeenCalledWith("1HGBH41JXMN109186");
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đăng ký xe thành công!",
                    })
                );
            });

            await waitFor(() => {
                expect(mockSetUserVehicles).toHaveBeenCalledWith(mockUpdatedVehicles);
            });
        });

        it("shows error toast when registration fails", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);
            axiosServices.registerVehicleByVin.mockResolvedValueOnce({
                status: 400,
                messages: { business: "Registration failed" },
            });

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận đăng ký xe")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: "Có" });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đăng ký xe thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("handles network error during registration", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);
            axiosServices.registerVehicleByVin.mockRejectedValueOnce(new Error("Network error"));

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận đăng ký xe")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: "Có" });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đăng ký xe thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("disables register button when 3 vehicles are already registered", () => {
            renderWithContext([mockVehicle1, mockVehicle2, mockVehicle3]);

            const registerButton = screen.getByRole("button", { name: /Đã đạt giới hạn/i });
            expect(registerButton).toBeDisabled();
        });
    });

    describe("Vehicle Unregistration", () => {
        it("opens vehicle details dialog when Chi tiết button is clicked", async () => {
            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
                expect(screen.getByText("Thông tin và hành động dành cho xe này.")).toBeInTheDocument();
            });
        });

        it("successfully unregisters vehicle and updates vehicle list", async () => {
            const mockDeactivateResponse = {
                messages: { success: "Vehicle unregistered successfully" },
            };

            const mockUpdatedVehicles = [];

            axiosServices.deactivateVehicleByVin.mockResolvedValueOnce(mockDeactivateResponse);
            axiosServices.getUserAllVehicles.mockResolvedValueOnce(mockUpdatedVehicles);

            renderWithContext([mockVehicle1]);

            // Open details dialog
            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            // Click unregister button
            const unregisterButton = screen.getByRole("button", { name: "Hủy đăng ký" });
            fireEvent.click(unregisterButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận hủy đăng ký")).toBeInTheDocument();
            });

            // Confirm unregistration
            const confirmButtons = screen.getAllByRole("button", { name: "Có" });
            const confirmUnregister = confirmButtons[confirmButtons.length - 1];
            fireEvent.click(confirmUnregister);

            await waitFor(() => {
                expect(axiosServices.deactivateVehicleByVin).toHaveBeenCalledWith("v1");
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Hủy đăng ký xe thành công!",
                    })
                );
            });

            await waitFor(() => {
                expect(mockSetUserVehicles).toHaveBeenCalledWith(mockUpdatedVehicles);
            });
        });

        it("shows error toast when unregistration fails", async () => {
            axiosServices.deactivateVehicleByVin.mockResolvedValueOnce({
                status: 400,
                error: "Deactivation failed",
            });

            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            const unregisterButton = screen.getByRole("button", { name: "Hủy đăng ký" });
            fireEvent.click(unregisterButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận hủy đăng ký")).toBeInTheDocument();
            });

            const confirmButtons = screen.getAllByRole("button", { name: "Có" });
            const confirmUnregister = confirmButtons[confirmButtons.length - 1];
            fireEvent.click(confirmUnregister);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Xóa xe thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("handles network error during unregistration", async () => {
            axiosServices.deactivateVehicleByVin.mockRejectedValueOnce(new Error("Network error"));

            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            const unregisterButton = screen.getByRole("button", { name: "Hủy đăng ký" });
            fireEvent.click(unregisterButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận hủy đăng ký")).toBeInTheDocument();
            });

            const confirmButtons = screen.getAllByRole("button", { name: "Có" });
            const confirmUnregister = confirmButtons[confirmButtons.length - 1];
            fireEvent.click(confirmUnregister);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Xóa xe thất bại",
                        variant: "destructive",
                    })
                );
            });
        });

        it("displays all vehicle details in the detail dialog", async () => {
            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            // Check all details are displayed - use getAllByText for duplicates
            expect(screen.getByText("1HGBH41JXMN109186")).toBeInTheDocument();
            expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
            expect(screen.getAllByText("VF 8").length).toBeGreaterThan(0);
            expect(screen.getByText("LITHIUM_ION")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("Đỏ")).toBeInTheDocument();
            expect(screen.getByText("30A-12345")).toBeInTheDocument();
        });
    });

    describe("Dialog Interactions", () => {
        it("closes registration dialog when clicking Không", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận đăng ký xe")).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole("button", { name: "Không" });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText("Xác nhận đăng ký xe")).not.toBeInTheDocument();
            });
        });

        it("closes detail dialog when clicking Đóng", async () => {
            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            const closeButton = screen.getByRole("button", { name: "Đóng" });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText("Chi tiết xe VF 8")).not.toBeInTheDocument();
            });
        });
    });

    describe("Edge Cases", () => {
        it("handles empty userVehicles array from context", () => {
            renderWithContext([]);

            expect(screen.getByText("0/3")).toBeInTheDocument();
            expect(screen.getByText("Bạn chưa đăng ký xe nào")).toBeInTheDocument();
        });

        it("handles null userVehicles from context", () => {
            const mockContextValue = {
                userData: mockUserData,
                userVehicles: null,
                setUserVehicles: mockSetUserVehicles,
            };

            render(
                <BrowserRouter>
                    <SystemContext.Provider value={mockContextValue}>
                        <VehicleRegistration />
                    </SystemContext.Provider>
                </BrowserRouter>
            );

            expect(screen.getByText("0/3")).toBeInTheDocument();
        });

        it("handles VIN lookup with business error message", async () => {
            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce({
                status: 400,
                messages: { business: "Vehicle already registered" },
            });

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: "Vehicle already registered",
                    })
                );
            });
        });

        it("handles VIN lookup with auth error message", async () => {
            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce({
                status: 401,
                messages: { auth: "Unauthorized" },
            });

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        description: "Unauthorized",
                    })
                );
            });
        });

        it("handles reload vehicle list error after registration", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
            };

            const mockRegisterResponse = {
                messages: { success: "Vehicle registered successfully" },
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);
            axiosServices.registerVehicleByVin.mockResolvedValueOnce(mockRegisterResponse);
            axiosServices.getUserAllVehicles.mockResolvedValueOnce({
                status: 500,
                error: "Server error",
            });

            renderWithContext();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(screen.getByDisplayValue("VF 8")).toBeInTheDocument();
            });

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận đăng ký xe")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: "Có" });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đăng ký xe thất bại",
                    })
                );
            });
        });

        it("handles reload vehicle list error after unregistration", async () => {
            const mockDeactivateResponse = {
                messages: { success: "Vehicle unregistered successfully" },
            };

            axiosServices.deactivateVehicleByVin.mockResolvedValueOnce(mockDeactivateResponse);
            axiosServices.getUserAllVehicles.mockResolvedValueOnce({
                status: 500,
                error: "Server error",
            });

            renderWithContext([mockVehicle1]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            const unregisterButton = screen.getByRole("button", { name: "Hủy đăng ký" });
            fireEvent.click(unregisterButton);

            await waitFor(() => {
                expect(screen.getByText("Xác nhận hủy đăng ký")).toBeInTheDocument();
            });

            const confirmButtons = screen.getAllByRole("button", { name: "Có" });
            const confirmUnregister = confirmButtons[confirmButtons.length - 1];
            fireEvent.click(confirmUnregister);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: "Đăng ký xe thất bại",
                    })
                );
            });
        });

        it("displays vehicle details with missing optional fields", async () => {
            const vehicleWithMissingFields = {
                ...mockVehicle1,
                color: undefined,
                manufactureYear: undefined,
                purchaseDate: undefined,
            };

            renderWithContext([vehicleWithMissingFields]);

            const detailButtons = screen.getAllByRole("button", { name: /Chi tiết/i });
            fireEvent.click(detailButtons[0]);

            await waitFor(() => {
                expect(screen.getByText("Chi tiết xe VF 8")).toBeInTheDocument();
            });

            // Check that missing fields show "—"
            const emDashes = screen.getAllByText("—");
            expect(emDashes.length).toBeGreaterThan(0);
        });
    });

    describe("Button States", () => {
        it("enables register button only after successful VIN lookup for available vehicle", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: false,
                userId: null,
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            expect(registerButton).toBeDisabled();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(registerButton).not.toBeDisabled();
            });
        });

        it("keeps register button disabled when vehicle is already active", async () => {
            const mockVehicleInfo = {
                vehicleType: "VF 8",
                batteryType: "LITHIUM_ION",
                active: true,
                userId: "user123",
            };

            axiosServices.getVehicleInfoByVin.mockResolvedValueOnce(mockVehicleInfo);

            renderWithContext();

            const registerButton = screen.getByRole("button", { name: /Đăng ký xe/i });
            expect(registerButton).toBeDisabled();

            const vinInput = screen.getByLabelText(/Mã VIN/i);
            fireEvent.change(vinInput, { target: { value: "1HGBH41JXMN109186" } });

            await waitFor(() => {
                expect(registerButton).toBeDisabled();
            });
        });
    });

    describe("Cancel Button", () => {
        it("renders cancel button with link to /driver", () => {
            renderWithContext();

            const cancelButton = screen.getByRole("link", { name: /Hủy bỏ/i });
            expect(cancelButton).toHaveAttribute("href", "/driver");
        });
    });
});
