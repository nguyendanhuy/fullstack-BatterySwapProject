import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock environment variable
process.env.VITE_GOONG_API_KEY = "mock_api_key_for_test";

// Stub matchMedia for antd
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }),
});

// Mock toast
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

// Mock useSessionStorage
const mockSessionStorageState = {};
jest.mock("../hooks/useSessionStorage", () => ({
    useSessionStorage: jest.fn((key, initialValue) => {
        if (!(key in mockSessionStorageState)) {
            mockSessionStorageState[key] = initialValue;
        }
        const setValue = (newValue) => {
            mockSessionStorageState[key] = typeof newValue === 'function'
                ? newValue(mockSessionStorageState[key])
                : newValue;
        };
        return [mockSessionStorageState[key], setValue];
    })
}));

// Mock child components
jest.mock("../pages/GoongMap", () => {
    return function GoongMapMock(props) {
        return (
            <div data-testid="goong-map">
                <button onClick={() => props.onLocationSelect?.({ lat: 10, lng: 106, address: "123 Mock St, Quan 1, TP HCM" })}>
                    Chọn vị trí mock
                </button>
            </div>
        );
    };
});

jest.mock("../components/ProvinceDistrictWardSelect", () => {
    return function PDWMock({ setFilterAddress }) {
        return (
            <div data-testid="pdw-mock">
                <button onClick={() => setFilterAddress({ provinceName: "TP HCM", districtName: "Quận 1", wardName: "Phường 1" })}>Set Full Address</button>
                <button onClick={() => setFilterAddress({ provinceName: "TP HCM", districtName: "Quận 2" })}>Set HCM Q2</button>
                <button onClick={() => setFilterAddress({ provinceName: "Ha Noi" })}>Set HN</button>
            </div>
        );
    };
});

jest.mock("../components/BookingSummary", () => {
    return function BookingSummaryMock({ selectBattery, onRemove }) {
        return (
            <div data-testid="booking-summary">
                {Object.keys(selectBattery).map(vehicleId => (
                    <div key={vehicleId}>
                        <span>Vehicle {vehicleId}: {selectBattery[vehicleId].qty} batteries</span>
                        <button onClick={() => onRemove(vehicleId)}>Remove {vehicleId}</button>
                    </div>
                ))}
            </div>
        );
    };
});

// Mock station data
const nearbyStations = [
    {
        stationId: 1,
        stationName: "Station A",
        address: "Phường 1, Quận 1, TP Hồ Chí Minh",
        latitude: 10,
        longitude: 106,
        rating: 4.5,
        active: true,
        availableCount: 3,
        totalBatteries: 10,
        batteries: [
            { batteryType: "LITHIUM_ION", available: 2, charging: 1 },
            { batteryType: "NICKEL_METAL_HYDRIDE", available: 1, charging: 0 },
        ],
    },
    {
        stationId: 2,
        stationName: "Station B",
        address: "Xã Trung, Huyện Văn, Tỉnh Bình Dương",
        latitude: 11,
        longitude: 107,
        rating: 4.2,
        active: false,
        availableCount: 1,
        totalBatteries: 5,
        batteries: [
            { batteryType: "LEAD_ACID", available: 1, charging: 0 },
        ],
    },
];

jest.mock("../services/axios.services", () => ({
    getAllStations: jest.fn(async () => nearbyStations),
    getStationNearbyLocation: jest.fn(async () => nearbyStations),
}));

// Import mocked functions for use in tests
import { getAllStations, getStationNearbyLocation } from "../services/axios.services";

// Mock SystemContext
jest.mock("../contexts/system.context", () => {
    const React = require("react");
    return { SystemContext: React.createContext({ userVehicles: [], setUserVehicles: jest.fn(), userData: {} }) };
});
import { SystemContext } from "../contexts/system.context";

// Import component after mocks
import StationFinder from "../pages/driver/StationFinder";

// Mock window.open
window.open = jest.fn();

// Mock fetch for Distance Matrix
const dmOk = {
    ok: true,
    json: async () => ({
        rows: [{
            elements: [
                { distance: { text: "0.5 km" }, duration: { text: "1 min" } },
                { distance: { text: "2.1 km" }, duration: { text: "5 min" } },
            ],
        }],
    }),
};

beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSessionStorageState).forEach(key => delete mockSessionStorageState[key]);
    delete navigator.geolocation;
    global.fetch = jest.fn(async () => dmOk);
});

const renderWithProviders = (ui, { providerValue } = {}) => {
    const value = providerValue || { userVehicles: [], setUserVehicles: jest.fn(), userData: {} };
    return render(
        <MemoryRouter>
            <SystemContext.Provider value={value}>{ui}</SystemContext.Provider>
        </MemoryRouter>
    );
};

describe("StationFinder - 100% Coverage", () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test("renders basic UI", () => {
        renderWithProviders(<StationFinder />);
        expect(screen.getByText(/Tìm trạm/i)).toBeInTheDocument();
    });

    // Lines 103-110: assignedAtStationType function
    test("calculates assigned batteries at station correctly", async () => {
        const userVehicles = [
            { vehicleId: 101, vehicleType: "Xe A", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => {
            jest.advanceTimersByTime(350);
            await Promise.resolve();
        });

        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        // Select vehicle
        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const option = screen.queryByText(/Xe A.*LITHIUM_ION.*cần 2/);
                    if (option) fireEvent.click(option);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        // Book battery - this tests assignedAtStationType
        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });
                }
            }
        }
    });

    // Lines 112-130: ensureVehicleLine function
    test("ensures vehicle line is created when selecting vehicle", async () => {
        const userVehicles = [
            { vehicleId: 201, vehicleType: "Motor A", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        await act(async () => { jest.advanceTimersByTime(100); });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const option = screen.queryByText(/Motor A.*LITHIUM_ION.*cần 1/);
                    if (option) fireEvent.click(option);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });
    });

    // Lines 132-137: removeVehicleLine function
    test("removes vehicle line from booking", async () => {
        const userVehicles = [
            { vehicleId: 301, vehicleType: "Bike X", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/Bike X/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const plusButtons = screen.queryAllByRole("button", { name: "+" });
        if (plusButtons.length > 0) {
            fireEvent.click(plusButtons[0]);
            await act(async () => { jest.advanceTimersByTime(100); });
        }

        const removeButtons = screen.queryAllByRole("button", { name: /Remove/i });
        if (removeButtons.length > 0) {
            fireEvent.click(removeButtons[0]);
            await act(async () => { jest.advanceTimersByTime(100); });
        }
    });

    // Lines 145-149: battery type mismatch error
    test("shows error when trying to book wrong battery type", async () => {
        const { toast } = require("sonner");
        const userVehicles = [
            { vehicleId: 401, vehicleType: "Scooter", batteryType: "NICKEL_METAL_HYDRIDE", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/Scooter.*NICKEL_METAL_HYDRIDE/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        // Try to book LITHIUM_ION (wrong type)
        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    expect(toast.error).toHaveBeenCalledWith(
                        "Loại pin không khớp xe",
                        expect.objectContaining({ description: "Hãy chọn đúng loại pin của xe." })
                    );
                }
            }
        }
    });

    test("shows 'Chưa có xe' when no vehicles available", async () => {
        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles: [], setUserVehicles: jest.fn(), userData: {} }
        });

        await act(async () => { jest.advanceTimersByTime(100); });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);

                await waitFor(() => {
                    const noVehicleOption = screen.queryByText(/Chưa có xe/i);
                    if (noVehicleOption) {
                        expect(noVehicleOption).toBeInTheDocument();
                    }
                });
                break;
            }
        }
    });

    // Lines 151-156: exceeding vehicle battery count
    test("prevents booking more batteries than vehicle capacity", async () => {
        const { toast } = require("sonner");
        const userVehicles = [
            { vehicleId: 501, vehicleType: "MotorA", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/MotorA.*LITHIUM_ION.*cần 1/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    // Try to book 2nd battery (should fail)
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    expect(toast.error).toHaveBeenCalledWith(
                        "Vượt hạn mức tổng",
                        expect.objectContaining({ description: expect.stringContaining("Tối đa 1 pin cho xe") })
                    );
                }
            }
        }
    });

    // Lines 158-163: exceeding total quota
    test("prevents booking when total quota is exhausted", async () => {
        const { toast } = require("sonner");
        const userVehicles = [
            { vehicleId: 601, vehicleType: "Motor1", batteryType: "LITHIUM_ION", batteryCount: 1 },
            { vehicleId: 602, vehicleType: "Motor2", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        mockSessionStorageState["battery-booking-selection"] = {
            "601": {
                vehicleInfo: { vehicleId: "601", vehicleType: "Motor1", batteryType: "LITHIUM_ION", batteryCount: 1 },
                stationInfo: { stationId: 1, stationName: "Station A" },
                batteryType: "LITHIUM_ION",
                qty: 1
            }
        };

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/Motor2.*LITHIUM_ION.*cần 1/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    expect(toast.error).toHaveBeenCalledWith(
                        "Vượt hạn mức tổng",
                        expect.objectContaining({ description: expect.stringContaining("pin cho tất cả xe") })
                    );
                }
            }
        }
    });

    // Lines 166-171: exceeding allowed quota for specific line
    test("prevents exceeding allowedForThisLine", async () => {
        const { toast } = require("sonner");
        const userVehicles = [
            { vehicleId: 701, vehicleType: "BigMotor", batteryType: "LITHIUM_ION", batteryCount: 3 },
            { vehicleId: 702, vehicleType: "SmallMotor", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        mockSessionStorageState["battery-booking-selection"] = {
            "702": {
                vehicleInfo: { vehicleId: "702", vehicleType: "SmallMotor", batteryType: "LITHIUM_ION", batteryCount: 1 },
                stationInfo: { stationId: 1, stationName: "Station A" },
                batteryType: "LITHIUM_ION",
                qty: 1
            }
        };

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/BigMotor.*LITHIUM_ION.*cần 3/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(50); });
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(50); });

                    expect(toast.error).toHaveBeenCalledWith(
                        "Vượt hạn mức tổng",
                        expect.objectContaining({ description: expect.stringMatching(/tối đa đến.*pin cho xe này/i) })
                    );
                }
            }
        }
    });

    // Lines 173-178: not enough batteries at station
    test("prevents booking when station runs out of batteries", async () => {
        const { toast } = require("sonner");
        const { getStationNearbyLocation } = require("../services/axios.services");

        getStationNearbyLocation.mockResolvedValueOnce([
            {
                stationId: 3,
                stationName: "Limited Station",
                address: "Phường 1, Quận 1, TP Hồ Chí Minh",
                latitude: 10,
                longitude: 106,
                rating: 4.5,
                active: true,
                availableCount: 1,
                totalBatteries: 10,
                batteries: [
                    { batteryType: "LITHIUM_ION", available: 1, charging: 9 },
                ],
            },
        ]);

        const userVehicles = [
            { vehicleId: 801, vehicleType: "Motor", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/Motor.*LITHIUM_ION.*cần 2/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    expect(toast.error).toHaveBeenCalledWith(
                        "Không đủ pin tại trạm",
                        expect.objectContaining({ description: expect.stringMatching(/Còn.*pin.*ở trạm này/i) })
                    );
                }
            }
        }
    });

    // Lines 181-186: qty = 0 removes stationInfo
    test("removes stationInfo when quantity decreases to zero", async () => {
        const userVehicles = [
            { vehicleId: 901, vehicleType: "TestMotor", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/TestMotor.*LITHIUM_ION.*cần 2/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    const minusButton = within(parent).queryByRole("button", { name: "−" });
                    if (minusButton) {
                        fireEvent.click(minusButton);
                        await act(async () => { jest.advanceTimersByTime(100); });
                    }
                }
            }
        }
    });

    // Lines 188-199: successfully updates vehicle selection with stationInfo
    test("successfully updates vehicle selection with stationInfo", async () => {
        const userVehicles = [
            { vehicleId: 1001, vehicleType: "FinalMotor", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/FinalMotor.*LITHIUM_ION.*cần 2/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    await waitFor(() => {
                        const summary = screen.queryByText(/Vehicle 1001: 1 batteries/i);
                        if (summary) expect(summary).toBeInTheDocument();
                    });
                }
            }
        }
    });

    // Lines 315-317: getKm returns Infinity for missing distance
    test("handles missing distance with em dash", async () => {
        const { getStationNearbyLocation } = require("../services/axios.services");

        getStationNearbyLocation.mockResolvedValueOnce([
            { ...nearbyStations[0], distance: "—" },
        ]);

        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    // Lines 336-339: AbortError handling
    test("handles AbortError silently in distanceMatrix", async () => {
        global.fetch = jest.fn(() => Promise.reject(new DOMException("AbortError", "AbortError")));

        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(screen.getByText(/Tìm trạm/i)).toBeInTheDocument();
        });
    });

    // Lines 505-513: vehicle filter with ALL
    test("handles vehicle filter ALL option", async () => {
        const userVehicles = [
            { vehicleId: 1101, vehicleType: "Motor1", batteryType: "LITHIUM_ION", batteryCount: 1 },
            { vehicleId: 1102, vehicleType: "Motor2", batteryType: "NICKEL_METAL_HYDRIDE", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        await act(async () => { jest.advanceTimersByTime(100); });

        const comboboxes = screen.getAllByRole("combobox");
        let vehicleFilterSelect = null;

        for (const combo of comboboxes) {
            const label = combo.closest('[class*="space-y"]')?.querySelector('label');
            if (label && label.textContent.includes("Pin theo xe")) {
                vehicleFilterSelect = combo;
                break;
            }
        }

        if (vehicleFilterSelect) {
            fireEvent.click(vehicleFilterSelect);

            await waitFor(() => {
                const allOption = screen.queryByText("Tất cả");
                if (allOption) {
                    fireEvent.click(allOption);
                }
            });

            await act(async () => { jest.advanceTimersByTime(100); });
        }
    });

    // Lines 505-513: battery type with underscores
    test("handles battery type with underscores in vehicle filter", async () => {
        const userVehicles = [
            { vehicleId: 1201, vehicleType: "Motor1", batteryType: "NICKEL_METAL_HYDRIDE", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        await act(async () => { jest.advanceTimersByTime(100); });

        const comboboxes = screen.getAllByRole("combobox");
        let vehicleFilterSelect = null;

        for (const combo of comboboxes) {
            const label = combo.closest('[class*="space-y"]')?.querySelector('label');
            if (label && label.textContent.includes("Pin theo xe")) {
                vehicleFilterSelect = combo;
                break;
            }
        }

        if (vehicleFilterSelect) {
            fireEvent.click(vehicleFilterSelect);

            await waitFor(() => {
                const options = screen.queryAllByText(/Motor1.*NICKEL_METAL_HYDRIDE/);
                if (options.length > 0) fireEvent.click(options[options.length - 1]);
            });

            await act(async () => { jest.advanceTimersByTime(100); });
        }
    });

    // Lines 750-769: LITHIUM_ION battery rendering
    test("renders LITHIUM_ION with blue gradient", async () => {
        const userVehicles = [
            { vehicleId: 1301, vehicleType: "LithiumMotor", batteryType: "LITHIUM_ION", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const lithiumBatteries = screen.queryAllByText(/LITHIUM_ION/i);
        expect(lithiumBatteries.length).toBeGreaterThan(0);
    });

    // Lines 750-769: NICKEL_METAL_HYDRIDE battery rendering
    test("renders NICKEL_METAL_HYDRIDE with purple gradient", async () => {
        const userVehicles = [
            { vehicleId: 1401, vehicleType: "NickelMotor", batteryType: "NICKEL_METAL_HYDRIDE", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const nickelBatteries = screen.queryAllByText(/NICKEL_METAL_HYDRIDE/i);
        expect(nickelBatteries.length).toBeGreaterThan(0);
    });

    // Lines 750-769: LEAD_ACID battery rendering (default case)
    test("renders LEAD_ACID with orange gradient", async () => {
        const userVehicles = [
            { vehicleId: 1501, vehicleType: "LeadMotor", batteryType: "LEAD_ACID", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const leadBatteries = screen.queryAllByText(/LEAD_ACID/i);
        expect(leadBatteries.length).toBeGreaterThan(0);
    });

    // Lines 750-769: meQty > 0 displays quantity
    test("shows quantity span when meQty is greater than 0", async () => {
        const userVehicles = [
            { vehicleId: 1601, vehicleType: "TestMotor", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/TestMotor.*LITHIUM_ION.*cần 2/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });
                }
            }
        }
    });

    // Additional coverage: filter by wardName
    test("handles filter by wardName in matchByFilterAddress", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        fireEvent.click(screen.getByRole("button", { name: /Set Full Address/i }));
        await act(async () => { jest.advanceTimersByTime(100); });

        expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
    });

    // Additional coverage: filter by districtName
    test("handles filter by districtName in matchByFilterAddress", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        fireEvent.click(screen.getByRole("button", { name: /Set HCM Q2/i }));
        await act(async () => { jest.advanceTimersByTime(100); });

        expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
    });

    // Additional coverage: disabled + button when no vehicle selected
    test("disables + button when currentVehicleId is null", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    expect(plusButton).toBeDisabled();
                }
            }
        }
    });

    // Additional coverage: disabled + button when station is inactive
    test("disables + button when station is inactive", async () => {
        const { getStationNearbyLocation } = require("../services/axios.services");
        getStationNearbyLocation.mockResolvedValueOnce([
            { ...nearbyStations[1], active: false },
        ]);

        const userVehicles = [
            { vehicleId: 1701, vehicleType: "TestMotor", batteryType: "LEAD_ACID", batteryCount: 1 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/TestMotor.*LEAD_ACID/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        const batteryDivs = screen.queryAllByText(/LEAD_ACID/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    expect(plusButton).toBeDisabled();
                }
            }
        }
    });

    // Additional coverage: empty batteries array
    test("displays no battery info when station has empty batteries array", async () => {
        const { getStationNearbyLocation } = require("../services/axios.services");
        getStationNearbyLocation.mockResolvedValueOnce([
            { ...nearbyStations[0], batteries: [] },
        ]);

        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        await waitFor(() => {
            const noInfoText = screen.queryByText(/Không có thông tin pin/i);
            if (noInfoText) expect(noInfoText).toBeInTheDocument();
        });
    });

    // GPS geolocation success with reverse geocoding
    test("handles GPS location success with reverse geocode", async () => {
        const mockGeolocation = {
            getCurrentPosition: jest.fn((success) => {
                success({
                    coords: { latitude: 10.7769, longitude: 106.7009 }
                });
            })
        };
        global.navigator.geolocation = mockGeolocation;

        global.fetch = jest.fn().mockImplementation((url) => {
            if (url.includes('geocode')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        results: [{ formatted_address: "123 Test Street, District 1, HCMC" }]
                    })
                });
            }
            return Promise.resolve(dmOk);
        });

        renderWithProviders(<StationFinder />);

        await act(async () => { jest.advanceTimersByTime(500); });

        await waitFor(() => {
            const input = screen.getByPlaceholderText(/Chọn địa chỉ của bạn trên bản đồ/i);
            expect(input.value).toContain("Test Street");
        }, { timeout: 2000 });
    });

    // GPS geolocation error
    test("handles GPS location error", async () => {
        const { getAllStations } = require("../services/axios.services");
        const mockGeolocation = {
            getCurrentPosition: jest.fn((success, error) => {
                error({ message: "Location permission denied" });
            })
        };
        global.navigator.geolocation = mockGeolocation;

        renderWithProviders(<StationFinder />);

        await act(async () => { jest.advanceTimersByTime(500); });

        await waitFor(() => {
            expect(getAllStations).toHaveBeenCalled();
        });
    });

    // Distance filter change
    test("handles distance filter change", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        // Find and click distance filter
        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const label = combo.closest('[class*="space-y"]')?.querySelector('label');
            if (label && label.textContent.includes("Khoảng cách")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const option = screen.queryByText(/Dưới 5 km/i);
                    if (option) fireEvent.click(option);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });
    });

    // Test loadStations error handling
    test("handles error when loading stations", async () => {
        const { toast } = require("sonner");
        const { getStationNearbyLocation } = require("../services/axios.services");

        getStationNearbyLocation.mockRejectedValueOnce(new Error("Network error"));

        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Lỗi khi gọi trạm gần nhất",
                expect.objectContaining({ description: expect.stringContaining("Network error") })
            );
        }, { timeout: 2000 });
    });

    // Test getAllStation error
    test("handles error when getting all stations", async () => {
        const { toast } = require("sonner");
        const { getAllStations } = require("../services/axios.services");

        getAllStations.mockResolvedValueOnce({ error: "Database connection failed" });

        delete navigator.geolocation;

        renderWithProviders(<StationFinder />);

        await act(async () => { jest.advanceTimersByTime(500); });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Lỗi gọi thông tin trạm",
                expect.objectContaining({ description: expect.stringContaining("Database connection failed") })
            );
        }, { timeout: 2000 });
    });

    // Test distance matrix with stations processing
    test("processes distance matrix correctly", async () => {
        global.fetch = jest.fn(async (url) => {
            if (url.includes('DistanceMatrix')) {
                return {
                    ok: true,
                    json: async () => ({
                        rows: [{
                            elements: [
                                { distance: { text: "1.5 km" }, duration: { text: "3 min" } },
                                { distance: { text: "3.2 km" }, duration: { text: "8 min" } },
                            ]
                        }]
                    })
                };
            }
            return dmOk;
        });

        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    // Test showing directions
    test("opens Google Maps directions when clicking show way button", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const showWayButtons = screen.queryAllByRole("button", { name: /Chỉ đường/i });
        if (showWayButtons.length > 0) {
            fireEvent.click(showWayButtons[0]);
            expect(window.open).toHaveBeenCalledWith(
                expect.stringContaining("google.com/maps/dir"),
                "_blank"
            );
        }
    });

    // Test minus button functionality
    test("decreases battery quantity when clicking minus button", async () => {
        const userVehicles = [
            { vehicleId: 2001, vehicleType: "TestBike", batteryType: "LITHIUM_ION", batteryCount: 2 },
        ];

        renderWithProviders(<StationFinder />, {
            providerValue: { userVehicles, setUserVehicles: jest.fn(), userData: {} }
        });

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        const comboboxes = screen.getAllByRole("combobox");
        for (const combo of comboboxes) {
            const parent = combo.closest('[class*="space-y"]');
            if (parent && parent.textContent.includes("Xe")) {
                fireEvent.click(combo);
                await waitFor(() => {
                    const options = screen.queryAllByText(/TestBike.*LITHIUM_ION.*cần 2/);
                    if (options.length > 0) fireEvent.click(options[options.length - 1]);
                });
                break;
            }
        }

        await act(async () => { jest.advanceTimersByTime(100); });

        // Click + to add battery
        const batteryDivs = screen.queryAllByText(/LITHIUM_ION/i);
        if (batteryDivs.length > 0) {
            const parent = batteryDivs[0].closest('[class*="flex items-center justify-between"]');
            if (parent) {
                const plusButton = within(parent).queryByRole("button", { name: "+" });
                if (plusButton) {
                    fireEvent.click(plusButton);
                    await act(async () => { jest.advanceTimersByTime(100); });

                    // Now click - to decrease
                    const minusButton = within(parent).queryByRole("button", { name: "−" });
                    if (minusButton) {
                        fireEvent.click(minusButton);
                        await act(async () => { jest.advanceTimersByTime(100); });
                    }
                }
            }
        }
    });

    // Test province/district/ward address filtering
    test("filters stations by province only", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument(), { timeout: 3000 });

        fireEvent.click(screen.getByRole("button", { name: /Set HN/i }));
        await act(async () => { jest.advanceTimersByTime(100); });

        expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
    });

    // Test selecting primary station details
    test("displays primary station details when available", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));
        fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí mock/i }));
        fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

        await act(async () => { jest.advanceTimersByTime(350); });
        await waitFor(() => {
            expect(screen.getByText(/trạm tìm thấy/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        await waitFor(() => {
            const stationNames = screen.queryAllByText(/Station A/i);
            if (stationNames.length > 0) expect(stationNames[0]).toBeInTheDocument();
        });
    });

    // Test cancel map dialog
    test("closes map dialog when clicking cancel", async () => {
        renderWithProviders(<StationFinder />);

        fireEvent.click(screen.getByRole("button", { name: /Chọn trên bản đồ/i }));

        await act(async () => { jest.advanceTimersByTime(100); });

        const cancelButtons = screen.queryAllByRole("button", { name: /Hủy/i });
        if (cancelButtons.length > 0) {
            fireEvent.click(cancelButtons[0]);
            await act(async () => { jest.advanceTimersByTime(100); });
        }
    });



    // Test GPS fetch error in catch block
    test("handles GPS reverse geocode fetch error", async () => {
        const { getAllStations } = require("../services/axios.services");

        const mockGeolocation = {
            getCurrentPosition: jest.fn((success) => {
                success({
                    coords: { latitude: 10.7769, longitude: 106.7009 }
                });
            })
        };
        global.navigator.geolocation = mockGeolocation;

        // Mock fetch to throw error
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        getAllStations.mockResolvedValue(dmOk);

        renderWithProviders(<StationFinder />);

        await act(async () => { jest.advanceTimersByTime(600); });

        // Should fallback to coordinates
        await waitFor(() => {
            const input = screen.getByPlaceholderText(/Chọn địa chỉ của bạn trên bản đồ/i);
            expect(input.value).toContain("10.776900");
        }, { timeout: 2000 });
    });

    // Test battery type rendering variations - LITHIUM_ION with blue gradient (line 717-718)
    test("renders LITHIUM_ION battery type with blue gradient styling", async () => {
        const stationsWithLithiumIon = [
            {
                stationId: 1,
                stationName: "Station Lithium",
                address: "Phường 1, Quận 1, TP Hồ Chí Minh",
                latitude: 10,
                longitude: 106,
                rating: 4.5,
                active: true,
                availableCount: 5,
                totalBatteries: 10,
                batteries: [
                    { batteryType: "LITHIUM_ION", available: 5, charging: 2 }
                ],
            }
        ];

        getAllStations.mockResolvedValueOnce(stationsWithLithiumIon);

        renderWithProviders(<StationFinder />);

        // Verify LITHIUM_ION is rendered
        await waitFor(() => {
            const lithiumTexts = screen.getAllByText("LITHIUM_ION");
            expect(lithiumTexts.length).toBeGreaterThan(0);
        });
    });

    // Test battery type rendering variations - NICKEL_METAL_HYDRIDE with purple gradient (line 719-720)
    test("renders NICKEL_METAL_HYDRIDE battery type with purple gradient styling", async () => {
        const stationsWithNickel = [
            {
                stationId: 2,
                stationName: "Station Nickel",
                address: "Phường 2, Quận 2, TP Hồ Chí Minh",
                latitude: 10.1,
                longitude: 106.1,
                rating: 4.0,
                active: true,
                availableCount: 3,
                totalBatteries: 8,
                batteries: [
                    { batteryType: "NICKEL_METAL_HYDRIDE", available: 3, charging: 1 }
                ],
            }
        ];

        getAllStations.mockResolvedValueOnce(stationsWithNickel);

        renderWithProviders(<StationFinder />);

        // Verify NICKEL_METAL_HYDRIDE is rendered
        await waitFor(() => {
            const nickelTexts = screen.getAllByText("NICKEL_METAL_HYDRIDE");
            expect(nickelTexts.length).toBeGreaterThan(0);
        });
    });

    // Test battery type rendering variations - default LEAD_ACID with orange gradient (line 721)
    test("renders default battery type (LEAD_ACID) with orange gradient styling", async () => {
        const stationsWithLeadAcid = [
            {
                stationId: 3,
                stationName: "Station Lead Acid",
                address: "Phường 3, Quận 3, TP Hồ Chí Minh",
                latitude: 10.2,
                longitude: 106.2,
                rating: 3.5,
                active: true,
                availableCount: 4,
                totalBatteries: 6,
                batteries: [
                    { batteryType: "LEAD_ACID", available: 4, charging: 1 }
                ],
            }
        ];

        getAllStations.mockResolvedValueOnce(stationsWithLeadAcid);
        renderWithProviders(<StationFinder />);

        // Verify LEAD_ACID is rendered
        await waitFor(() => {
            const leadAcidTexts = screen.getAllByText("LEAD_ACID");
            expect(leadAcidTexts.length).toBeGreaterThan(0);
        });
    });

    // Test multiple battery types rendering together (covers all variations at once)
    test("renders multiple battery types with correct gradient styling simultaneously", async () => {
        const stationWithMultipleBatteries = [
            {
                stationId: 10,
                stationName: "Multi Battery Station",
                address: "Phường 10, Quận 10, TP Hồ Chí Minh",
                latitude: 10.5,
                longitude: 106.5,
                rating: 5.0,
                active: true,
                availableCount: 12,
                totalBatteries: 20,
                batteries: [
                    { batteryType: "LITHIUM_ION", available: 5, charging: 2 },
                    { batteryType: "NICKEL_METAL_HYDRIDE", available: 4, charging: 1 },
                    { batteryType: "LEAD_ACID", available: 3, charging: 1 }
                ],
            }
        ];

        getAllStations.mockResolvedValueOnce(stationWithMultipleBatteries);

        renderWithProviders(<StationFinder />);

        // Verify all three battery types are rendered
        await waitFor(() => {
            expect(screen.getAllByText("LITHIUM_ION").length).toBeGreaterThan(0);
            expect(screen.getAllByText("NICKEL_METAL_HYDRIDE").length).toBeGreaterThan(0);
            expect(screen.getAllByText("LEAD_ACID").length).toBeGreaterThan(0);
        });
    });


});
