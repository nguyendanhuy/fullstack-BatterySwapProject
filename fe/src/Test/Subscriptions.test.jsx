import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Subscriptions from '../pages/driver/Subscriptions';
import { SystemContext } from '../contexts/system.context';
import * as axiosServices from '../services/axios.services';

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast })
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock axios services
jest.mock('../services/axios.services', () => ({
    getAllPlans: jest.fn(),
    getDriverSubscription: jest.fn(),
    getBookingHistoryByUserId: jest.fn(),
    cancelAutoRenewSubscription: jest.fn(),
    cancelSubscriptionImmediate: jest.fn()
}));

// Mock dayjs with extend support for antd
jest.mock('dayjs', () => {
    const originalDayjs = jest.requireActual('dayjs');
    const mockDayjs = (date) => {
        const instance = originalDayjs(date);
        instance.format = (format) => {
            if (format === 'DD/MM/YYYY') return '15/12/2025';
            return instance;
        };
        return instance;
    };
    mockDayjs.extend = jest.fn();
    mockDayjs.locale = jest.fn();
    return mockDayjs;
});

/**
 * UNIT TEST FRONTEND CHO SUBSCRIPTIONS COMPONENT
 * 
 * Cấu trúc kiểm thử:
 * 1. UI Rendering - Kiểm tra các element hiển thị đúng
 * 2. State - Kiểm tra state updates và data flow
 * 3. Sự kiện - Kiểm tra event handlers (click, submit, etc.)
 * 4. Xử lý API call - Kiểm tra API responses (success, error, edge cases)
 */

describe('Subscriptions Component', () => {
    const mockUserData = {
        userId: 1,
        walletBalance: 500000
    };

    const mockPlans = [
        {
            planId: 1,
            planName: 'Cơ Bản',
            description: 'Phù hợp cho người dùng ít. Giới hạn 10 lần đổi/tháng. Hỗ trợ 24/7.',
            price: 100000,
            swapLimit: 10
        },
        {
            planId: 2,
            planName: 'Tiêu Chuẩn',
            description: 'Phổ biến nhất. Giới hạn 30 lần đổi/tháng. Ưu tiên hỗ trợ.',
            price: 250000,
            swapLimit: 30
        },
        {
            planId: 3,
            planName: 'Cao Cấp',
            description: 'Không giới hạn số lần đổi. Ưu tiên cao nhất. Bảo hiểm pin.',
            price: 500000,
            swapLimit: 999
        }
    ];

    const mockSubscription = {
        subscriptionId: 1,
        plan: {
            planId: 2,
            planName: 'Tiêu Chuẩn',
            swapLimit: 30
        },
        startDate: '2025-11-01',
        endDate: '2025-12-01',
        autoRenew: true,
        usedSwaps: 15
    };

    const mockBookingHistory = [
        {
            bookingId: 1,
            bookingDate: '2025-11-10T10:00:00',
            bookingStatus: 'COMPLETED',
            stationName: 'Trạm A',
            timeSlot: '10:00-11:00',
            vehicleType: 'Xe máy',
            batteryCount: 1,
            subscriptionPlanName: 'Tiêu Chuẩn',
            payment: { paymentMethod: 'SUBSCRIPTION' }
        },
        {
            bookingId: 2,
            bookingDate: '2025-11-09T14:00:00',
            bookingStatus: 'CANCELLED',
            stationName: 'Trạm B',
            timeSlot: '14:00-15:00',
            vehicleType: 'Xe đạp điện',
            batteryCount: 2,
            subscriptionPlanName: 'Tiêu Chuẩn',
            payment: { paymentMethod: 'SUBSCRIPTION' }
        },
        {
            bookingId: 3,
            bookingDate: '2025-11-08T09:00:00',
            bookingStatus: 'FAILED',
            stationName: 'Trạm C',
            timeSlot: '09:00-10:00',
            vehicleType: 'Xe máy',
            batteryCount: 1,
            subscriptionPlanName: 'Tiêu Chuẩn',
            payment: { paymentMethod: 'SUBSCRIPTION' }
        },
        {
            bookingId: 4,
            bookingDate: '2025-11-07T16:00:00',
            bookingStatus: 'PENDING',
            stationName: 'Trạm D',
            timeSlot: '16:00-17:00',
            vehicleType: 'Xe máy',
            batteryCount: 1,
            subscriptionPlanName: 'Tiêu Chuẩn',
            payment: { paymentMethod: 'WALLET' }
        }
    ];

    const renderComponent = (userData = mockUserData) => {
        return render(
            <MemoryRouter>
                <SystemContext.Provider value={{ userData, setUserData: jest.fn() }}>
                    <Subscriptions />
                </SystemContext.Provider>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockToast.mockClear();
        mockNavigate.mockClear();

        // Default mocks - API trả về thành công với dữ liệu rỗng
        axiosServices.getAllPlans.mockResolvedValue({
            success: true,
            plans: mockPlans
        });
        axiosServices.getDriverSubscription.mockResolvedValue({
            success: true,
            subscription: null
        });
        axiosServices.getBookingHistoryByUserId.mockResolvedValue({
            data: []
        });
    });

    // ============================================================
    // 1. UI RENDERING TESTS
    // Mục tiêu: Đảm bảo các element hiển thị đúng khi component render
    // ============================================================
    describe('1. UI Rendering - Kiểm tra hiển thị giao diện', () => {

        test('1.1. Hiển thị loading spinner khi đang tải dữ liệu', () => {
            renderComponent();
            expect(screen.getByText('Đang tải danh sách gói...')).toBeInTheDocument();
        });

        test('1.2. Hiển thị tiêu đề trang sau khi load xong', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Gói thuê pin')).toBeInTheDocument();
            });
        });

        test('1.3. Hiển thị tất cả các gói có sẵn', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Cơ Bản')).toBeInTheDocument();
                expect(screen.getByText('Tiêu Chuẩn')).toBeInTheDocument();
                expect(screen.getByText('Cao Cấp')).toBeInTheDocument();
            });
        });

        test('1.4. Hiển thị giá gói đúng định dạng VNĐ', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('100.000 VNĐ')).toBeInTheDocument();
                expect(screen.getByText('250.000 VNĐ')).toBeInTheDocument();
                expect(screen.getByText('500.000 VNĐ')).toBeInTheDocument();
            });
        });

        test('1.5. Hiển thị badge "Phổ biến nhất" cho gói 2', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('⭐ Phổ biến nhất')).toBeInTheDocument();
                expect(screen.getByText('Tiết kiệm 20% so với gói cơ bản')).toBeInTheDocument();
            });
        });

        test('1.6. Hiển thị danh sách tính năng từ description', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Phù hợp cho người dùng ít.')).toBeInTheDocument();
                expect(screen.getByText('Giới hạn 10 lần đổi/tháng.')).toBeInTheDocument();
                expect(screen.getByText('Hỗ trợ 24/7.')).toBeInTheDocument();
            });
        });

        test('1.7. Hiển thị section lịch sử sử dụng', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Lịch sử sử dụng gần đây')).toBeInTheDocument();
                expect(screen.getByText('Theo dõi việc sử dụng dịch vụ đổi pin của bạn')).toBeInTheDocument();
            });
        });

        test('1.8. Hiển thị message khi chưa có gói thuê pin', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Bạn chưa có gói thuê pin')).toBeInTheDocument();
                expect(screen.getByText('Chọn một gói bên dưới để bắt đầu sử dụng dịch vụ')).toBeInTheDocument();
            });
        });

        test('1.9. Hiển thị thông tin gói hiện tại khi đã có subscription', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Gói hiện tại của bạn')).toBeInTheDocument();
                expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();
                expect(screen.getByText('Ngày hết hạn')).toBeInTheDocument();
            });
        });

        test('1.10. Hiển thị badge "Gói phổ biến" cho subscription gói 2', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Gói phổ biến')).toBeInTheDocument();
            });
        });
    });

    // ============================================================
    // 2. STATE TESTS
    // Mục tiêu: Kiểm tra state updates khi dữ liệu thay đổi
    // ============================================================
    describe('2. State - Kiểm tra trạng thái và cập nhật dữ liệu', () => {

        test('2.1. State packages được cập nhật sau khi fetch plans thành công', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Cơ Bản')).toBeInTheDocument();
                expect(screen.getByText('Tiêu Chuẩn')).toBeInTheDocument();
                expect(screen.getByText('Cao Cấp')).toBeInTheDocument();
            });
        });

        test('2.2. State loading chuyển từ true sang false sau khi load xong', async () => {
            renderComponent();

            // Ban đầu hiển thị loading
            expect(screen.getByText('Đang tải danh sách gói...')).toBeInTheDocument();

            // Sau khi load xong, không còn loading
            await waitFor(() => {
                expect(screen.queryByText('Đang tải danh sách gói...')).not.toBeInTheDocument();
            });
        });

        test('2.3. State currentSubscription là null khi chưa có gói', async () => {
            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Bạn chưa có gói thuê pin')).toBeInTheDocument();
            });
        });

        test('2.4. State currentSubscription được cập nhật khi có gói', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Gói hiện tại của bạn')).toBeInTheDocument();
                expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();
            });
        });

        test('2.5. State usageHistory được cập nhật với booking history', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Trạm A')).toBeInTheDocument();
                expect(screen.getByText('Trạm B')).toBeInTheDocument();
            });
        });

        test('2.6. State autoRenew cập nhật thành false sau khi hủy gia hạn', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                success: true,
                message: 'Hủy gia hạn thành công'
            });

            renderComponent();

            await waitFor(() => {
                const cancelButtons = screen.getAllByText('Hủy gia hạn');
                fireEvent.click(cancelButtons[0]);
            });

            await waitFor(() => {
                const confirmButton = screen.getByText('Hủy');
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Đã tắt tự động gia hạn')).toBeInTheDocument();
            });
        });

        test('2.7. State hiển thị đúng trạng thái auto-renew enabled', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: { ...mockSubscription, autoRenew: true }
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Đang bật gia hạn tự động')).toBeInTheDocument();
            });
        });

        test('2.8. State hiển thị đúng trạng thái auto-renew disabled', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: { ...mockSubscription, autoRenew: false }
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Đã tắt tự động gia hạn')).toBeInTheDocument();
            });
        });

        test('2.9. State hiển thị progress usage đúng', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.getByText('Bạn đã dùng')).toBeInTheDocument();
            });
        });

        test('2.10. State packages rỗng khi API trả về empty array', async () => {
            axiosServices.getAllPlans.mockResolvedValue({
                success: true,
                plans: []
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.queryByText('Cơ Bản')).not.toBeInTheDocument();
            });
        });
    });

    // ============================================================
    // 3. EVENT HANDLING TESTS
    // Mục tiêu: Kiểm tra các sự kiện người dùng (click, submit, etc.)
    // ============================================================
    describe('3. Sự kiện - Kiểm tra xử lý events', () => {

        test('3.1. Click nút "Chọn gói này" khi chưa có subscription', async () => {
            renderComponent();
            await waitFor(() => {
                const buttons = screen.getAllByText(/Chọn gói này/i);
                expect(buttons[0]).not.toBeDisabled();
                fireEvent.click(buttons[0]);

                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[0] }
                });
            });
        });

        test('3.2. Nút "Chọn gói này" bị disabled khi đã có subscription', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                const buttons = screen.getAllByText(/Đã có gói/i);
                buttons.forEach(button => {
                    expect(button).toBeDisabled();
                });
            });
        });

        test('3.3. Click nút "Hủy gia hạn" hiển thị Popconfirm', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                const cancelButtons = screen.getAllByText('Hủy gia hạn');
                fireEvent.click(cancelButtons[0]);
                expect(screen.getByText('Bạn có chắc chắn muốn hủy gia hạn tự động?')).toBeInTheDocument();
            });
        });

        test('3.4. Xác nhận hủy gia hạn gọi API cancelAutoRenew', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                success: true,
                message: 'Hủy gia hạn thành công'
            });

            renderComponent();
            await waitFor(() => {
                const cancelButtons = screen.getAllByText('Hủy gia hạn');
                fireEvent.click(cancelButtons[0]);
            });

            await waitFor(() => {
                const confirmButton = screen.getByText('Hủy');
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(axiosServices.cancelAutoRenewSubscription).toHaveBeenCalledWith(1);
            });
        });

        test('3.5. Click nút "Hủy gói" hiển thị Popconfirm', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                const cancelPlanButtons = screen.getAllByText('Hủy gói');
                fireEvent.click(cancelPlanButtons[0]);
                expect(screen.getByText('Hành động này sẽ hủy gói thuê pin của bạn ngay lập tức.')).toBeInTheDocument();
            });
        });

        test('3.6. Xác nhận hủy gói gọi API cancelSubscriptionImmediate', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.cancelSubscriptionImmediate.mockResolvedValue({
                success: true,
                message: 'Hủy gói thành công'
            });

            renderComponent();
            await waitFor(() => {
                const cancelPlanButtons = screen.getAllByText('Hủy gói');
                fireEvent.click(cancelPlanButtons[0]);
            });

            await waitFor(() => {
                const confirmButton = screen.getByText('Hủy');
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(axiosServices.cancelSubscriptionImmediate).toHaveBeenCalledWith(1);
            });
        });

        test('3.7. Click vào các gói khác nhau navigate với đúng plan data', async () => {
            renderComponent();
            await waitFor(() => {
                const selectButtons = screen.getAllByText(/Chọn gói này/i);

                // Click gói 1
                fireEvent.click(selectButtons[0]);
                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[0] }
                });

                mockNavigate.mockClear();

                // Click gói 2
                fireEvent.click(selectButtons[1]);
                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[1] }
                });
            });
        });

        test('3.8. Không hiển thị nút "Hủy gia hạn" khi autoRenew = false', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: { ...mockSubscription, autoRenew: false }
            });

            renderComponent();
            await waitFor(() => {
                expect(screen.queryByText('Hủy gia hạn')).not.toBeInTheDocument();
            });
        });

        test('3.9. Click nút disabled không navigate', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();
            await waitFor(() => {
                const disabledButtons = screen.getAllByText(/Đã có gói/i);
                fireEvent.click(disabledButtons[0]);
                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });

        test('3.10. Hiển thị tất cả nút "Chọn gói này" enabled khi no subscription', async () => {
            renderComponent();
            await waitFor(() => {
                const buttons = screen.getAllByText(/Chọn gói này/i);
                expect(buttons.length).toBe(3);
                buttons.forEach(button => {
                    expect(button).not.toBeDisabled();
                });
            });
        });
    });

    // ============================================================
    // 4. API CALL TESTS
    // Mục tiêu: Kiểm tra xử lý API responses (success, error, edge cases)
    // ============================================================
    describe('4. Xử lý API Call - Kiểm tra API requests/responses', () => {

        // 4.1. API Success Cases
        describe('4.1. API Success - Các trường hợp API thành công', () => {

            test('4.1.1. getAllPlans API thành công trả về danh sách gói', async () => {
                renderComponent();

                await waitFor(() => {
                    expect(axiosServices.getAllPlans).toHaveBeenCalled();
                    expect(screen.getByText('Cơ Bản')).toBeInTheDocument();
                });
            });

            test('4.1.2. getDriverSubscription API thành công với subscription', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });

                renderComponent();

                await waitFor(() => {
                    expect(axiosServices.getDriverSubscription).toHaveBeenCalledWith(1);
                    expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();
                });
            });

            test('4.1.3. getBookingHistoryByUserId API thành công trả về lịch sử', async () => {
                axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                    data: mockBookingHistory
                });

                renderComponent();

                await waitFor(() => {
                    expect(axiosServices.getBookingHistoryByUserId).toHaveBeenCalledWith(1);
                    expect(screen.getByText('Trạm A')).toBeInTheDocument();
                });
            });

            test('4.1.4. cancelAutoRenewSubscription API thành công', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                    success: true,
                    message: 'Hủy gia hạn tự động thành công'
                });

                renderComponent();

                await waitFor(() => {
                    const cancelButtons = screen.getAllByText('Hủy gia hạn');
                    fireEvent.click(cancelButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(axiosServices.cancelAutoRenewSubscription).toHaveBeenCalledWith(1);
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gia hạn tự động thành công!',
                        description: 'Hủy gia hạn tự động thành công',
                        className: 'bg-green-500 text-white'
                    });
                });
            });

            test('4.1.5. cancelSubscriptionImmediate API thành công và reload page', async () => {
                const originalLocation = window.location;
                delete window.location;
                const reloadMock = jest.fn();
                window.location = { reload: reloadMock };

                jest.useFakeTimers();

                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelSubscriptionImmediate.mockResolvedValue({
                    success: true,
                    message: 'Hủy gói thành công'
                });

                renderComponent();

                await waitFor(() => {
                    const cancelPlanButtons = screen.getAllByText('Hủy gói');
                    fireEvent.click(cancelPlanButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(axiosServices.cancelSubscriptionImmediate).toHaveBeenCalledWith(1);
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gói thuê pin thành công!',
                        description: 'Hủy gói thành công',
                        className: 'bg-green-500 text-white'
                    });
                });

                jest.runAllTimers();
                expect(reloadMock).toHaveBeenCalled();

                jest.useRealTimers();
                window.location = originalLocation;
            });
        });

        // 4.2. API Error Cases
        describe('4.2. API Error - Các trường hợp API lỗi', () => {

            test('4.2.1. getAllPlans API lỗi hiển thị toast error', async () => {
                const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
                axiosServices.getAllPlans.mockRejectedValue(new Error('Network error'));

                renderComponent();

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Lỗi tải dữ liệu',
                        description: 'Không thể tải dữ liệu gói thuê pin',
                        variant: 'destructive'
                    });
                });

                consoleError.mockRestore();
            });

            test('4.2.2. cancelAutoRenewSubscription API trả về success false', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                    success: false,
                    error: 'Lỗi hệ thống'
                });

                renderComponent();

                await waitFor(() => {
                    const cancelButtons = screen.getAllByText('Hủy gia hạn');
                    fireEvent.click(cancelButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gia hạn thất bại',
                        description: 'Lỗi hệ thống',
                        variant: 'destructive'
                    });
                });
            });

            test('4.2.3. cancelSubscriptionImmediate API trả về success false', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelSubscriptionImmediate.mockResolvedValue({
                    success: false
                });

                renderComponent();

                await waitFor(() => {
                    const cancelPlanButtons = screen.getAllByText('Hủy gói');
                    fireEvent.click(cancelPlanButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gói thất bại',
                        description: 'Không thể hủy gói thuê pin. Vui lòng thử lại',
                        variant: 'destructive'
                    });
                });
            });

            test('4.2.4. Xử lý khi userId không tồn tại', async () => {
                renderComponent({ userId: null });

                await waitFor(() => {
                    expect(screen.getByText('Chọn gói phù hợp với bạn')).toBeInTheDocument();
                });

                expect(axiosServices.getDriverSubscription).not.toHaveBeenCalled();
            });
        });

        // 4.3. API Edge Cases
        describe('4.3. API Edge Cases - Các trường hợp đặc biệt', () => {

            test('4.3.1. API trả về plans rỗng', async () => {
                axiosServices.getAllPlans.mockResolvedValue({
                    success: true,
                    plans: []
                });

                renderComponent();

                await waitFor(() => {
                    expect(screen.queryByText('Cơ Bản')).not.toBeInTheDocument();
                });
            });

            test('4.3.2. API trả về booking history null', async () => {
                axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                    data: null
                });

                renderComponent();

                await waitFor(() => {
                    expect(screen.getByText('Chưa có lịch sử sử dụng gói thuê bao')).toBeInTheDocument();
                });
            });

            test('4.3.3. API trả về subscription null', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: null
                });

                renderComponent();

                await waitFor(() => {
                    expect(screen.getByText('Bạn chưa có gói thuê pin')).toBeInTheDocument();
                });
            });

            test('4.3.4. cancelAutoRenewSubscription không có message trong response', async () => {
                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                    success: true
                });

                renderComponent();

                await waitFor(() => {
                    const cancelButtons = screen.getAllByText('Hủy gia hạn');
                    fireEvent.click(cancelButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gia hạn tự động thành công!',
                        description: 'Gói thuê pin của bạn sẽ không tự động gia hạn',
                        className: 'bg-green-500 text-white'
                    });
                });
            });

            test('4.3.5. cancelSubscriptionImmediate không có message trong response', async () => {
                const originalLocation = window.location;
                delete window.location;
                const reloadMock = jest.fn();
                window.location = { reload: reloadMock };

                jest.useFakeTimers();

                axiosServices.getDriverSubscription.mockResolvedValue({
                    success: true,
                    subscription: mockSubscription
                });
                axiosServices.cancelSubscriptionImmediate.mockResolvedValue({
                    success: true
                });

                renderComponent();

                await waitFor(() => {
                    const cancelPlanButtons = screen.getAllByText('Hủy gói');
                    fireEvent.click(cancelPlanButtons[0]);
                });

                await waitFor(() => {
                    const confirmButton = screen.getByText('Hủy');
                    fireEvent.click(confirmButton);
                });

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalledWith({
                        title: 'Hủy gói thuê pin thành công!',
                        description: 'Gói thuê pin của bạn đã được hủy',
                        className: 'bg-green-500 text-white'
                    });
                });

                jest.useRealTimers();
                window.location = originalLocation;
            });

            test('4.3.6. Filter bookings chỉ lấy SUBSCRIPTION payment method', async () => {
                axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                    data: mockBookingHistory
                });

                renderComponent();

                await waitFor(() => {
                    // Trạm A, B, C có payment method SUBSCRIPTION
                    expect(screen.getByText('Trạm A')).toBeInTheDocument();
                    expect(screen.getByText('Trạm B')).toBeInTheDocument();
                    expect(screen.getByText('Trạm C')).toBeInTheDocument();

                    // Trạm D có payment method WALLET - không hiển thị
                    expect(screen.queryByText('Trạm D')).not.toBeInTheDocument();
                });
            });
        });
    });

    // ============================================================
    // 5. USAGE HISTORY TESTS
    // Mục tiêu: Kiểm tra hiển thị và xử lý lịch sử sử dụng
    // ============================================================
    describe('5. Usage History - Kiểm tra lịch sử sử dụng', () => {

        test('5.1. Hiển thị lịch sử sử dụng với bookings', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Trạm A')).toBeInTheDocument();
                expect(screen.getByText('Trạm B')).toBeInTheDocument();
                expect(screen.getByText('Trạm C')).toBeInTheDocument();
            });
        });

        test('5.2. Hiển thị message khi không có lịch sử', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({ data: [] });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Chưa có lịch sử sử dụng gói thuê bao')).toBeInTheDocument();
            });
        });

        test('5.3. Hiển thị đúng trạng thái booking - COMPLETED', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: [mockBookingHistory[0]] // COMPLETED
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
            });
        });

        test('5.4. Hiển thị đúng trạng thái booking - CANCELLED', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: [mockBookingHistory[1]] // CANCELLED
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đã hủy')).toBeInTheDocument();
            });
        });

        test('5.5. Hiển thị đúng trạng thái booking - FAILED', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: [mockBookingHistory[2]] // FAILED
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Thất bại')).toBeInTheDocument();
            });
        });

        test('5.6. Hiển thị trạng thái default cho status không xác định', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: [{
                    ...mockBookingHistory[0],
                    bookingId: 100,
                    bookingStatus: 'UNKNOWN_STATUS'
                }]
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
            });
        });

        test('5.7. Hiển thị chi tiết booking đầy đủ', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                const vehicleTexts = screen.getAllByText('Xe máy (1 pin)');
                expect(vehicleTexts.length).toBeGreaterThan(0);
                expect(screen.getByText('Xe đạp điện (2 pin)')).toBeInTheDocument();
            });
        });

        test('5.8. Hiển thị tên gói subscription trong lịch sử', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                const planNames = screen.getAllByText(/Gói: Tiêu Chuẩn/);
                expect(planNames.length).toBeGreaterThan(0);
            });
        });

        test('5.9. Chỉ hiển thị bookings có payment method = SUBSCRIPTION', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                // Có 3 bookings với SUBSCRIPTION method (A, B, C)
                expect(screen.getByText('Trạm A')).toBeInTheDocument();
                expect(screen.getByText('Trạm B')).toBeInTheDocument();
                expect(screen.getByText('Trạm C')).toBeInTheDocument();

                // Không hiển thị Trạm D (WALLET method)
                expect(screen.queryByText('Trạm D')).not.toBeInTheDocument();
            });
        });

        test('5.10. Hiển thị nhiều trạng thái khác nhau cùng lúc', async () => {
            const diverseBookings = [
                { ...mockBookingHistory[0], bookingStatus: 'COMPLETED' },
                { ...mockBookingHistory[1], bookingStatus: 'CANCELLED' },
                { ...mockBookingHistory[2], bookingStatus: 'FAILED' },
                { ...mockBookingHistory[0], bookingId: 10, bookingStatus: 'PROCESSING' }
            ];

            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: diverseBookings
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
                expect(screen.getByText('Đã hủy')).toBeInTheDocument();
                expect(screen.getByText('Thất bại')).toBeInTheDocument();
                expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
            });
        });
    });

    // ============================================================
    // 6. SUBSCRIPTION DETAILS TESTS
    // Mục tiêu: Kiểm tra hiển thị chi tiết subscription hiện tại
    // ============================================================
    describe('6. Subscription Details - Kiểm tra chi tiết gói hiện tại', () => {

        beforeEach(() => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
        });

        test('6.1. Hiển thị card gói hiện tại', async () => {
            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Gói hiện tại của bạn')).toBeInTheDocument();
                expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();
            });
        });

        test('6.2. Hiển thị trạng thái auto-renew enabled', async () => {
            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đang bật gia hạn tự động')).toBeInTheDocument();
            });
        });

        test('6.3. Hiển thị trạng thái auto-renew disabled', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: { ...mockSubscription, autoRenew: false }
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đã tắt tự động gia hạn')).toBeInTheDocument();
            });
        });

        test('6.4. Hiển thị progress bar usage', async () => {
            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Bạn đã dùng')).toBeInTheDocument();
            });
        });

        test('6.5. Hiển thị ngày hết hạn', async () => {
            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Ngày hết hạn')).toBeInTheDocument();
            });
        });

        test('6.6. Hiển thị nút Hủy gia hạn khi auto-renew = true', async () => {
            renderComponent();

            await waitFor(() => {
                const cancelButtons = screen.getAllByText('Hủy gia hạn');
                expect(cancelButtons.length).toBeGreaterThan(0);
            });
        });

        test('6.7. Không hiển thị nút Hủy gia hạn khi auto-renew = false', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: { ...mockSubscription, autoRenew: false }
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('Hủy gia hạn')).not.toBeInTheDocument();
            });
        });

        test('6.8. Hiển thị nút Hủy gói luôn luôn', async () => {
            renderComponent();

            await waitFor(() => {
                const cancelPlanButtons = screen.getAllByText('Hủy gói');
                expect(cancelPlanButtons.length).toBeGreaterThan(0);
            });
        });

        test('6.9. Hiển thị badge "Gói phổ biến" cho plan 2', async () => {
            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Gói phổ biến')).toBeInTheDocument();
            });
        });

        test('6.10. Không hiển thị badge "Gói phổ biến" cho plan khác plan 2', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: {
                    ...mockSubscription,
                    plan: { ...mockSubscription.plan, planId: 1 }
                }
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('Gói phổ biến')).not.toBeInTheDocument();
            });
        });
    });

    // ============================================================
    // 7. EDGE CASES & SPECIAL SCENARIOS
    // Mục tiêu: Kiểm tra các trường hợp đặc biệt và biên
    // ============================================================
    describe('7. Edge Cases - Các trường hợp đặc biệt', () => {

        test('7.1. Xử lý khi plans array rỗng', async () => {
            axiosServices.getAllPlans.mockResolvedValue({
                success: true,
                plans: []
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('Cơ Bản')).not.toBeInTheDocument();
            });
        });

        test('7.2. Xử lý khi booking history data null', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: null
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Chưa có lịch sử sử dụng gói thuê bao')).toBeInTheDocument();
            });
        });

        test('7.3. Xử lý plan description không có dấu chấm', async () => {
            axiosServices.getAllPlans.mockResolvedValue({
                success: true,
                plans: [{
                    planId: 4,
                    planName: 'Test Plan',
                    description: 'Simple description',
                    price: 150000,
                    swapLimit: 20
                }]
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Simple description.')).toBeInTheDocument();
            });
        });

        test('7.4. Xử lý các plan với indices khác nhau cho icons/colors', async () => {
            const customPlans = [
                { ...mockPlans[2], planId: 3 },
                { ...mockPlans[0], planId: 1 },
                { ...mockPlans[1], planId: 2 }
            ];

            axiosServices.getAllPlans.mockResolvedValue({
                success: true,
                plans: customPlans
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Cao Cấp')).toBeInTheDocument();
                expect(screen.getByText('Cơ Bản')).toBeInTheDocument();
                expect(screen.getByText('Tiêu Chuẩn')).toBeInTheDocument();
            });
        });

        test('7.5. Xử lý nhiều bookings với statuses khác nhau', async () => {
            const diverseBookings = [
                { ...mockBookingHistory[0], bookingStatus: 'COMPLETED' },
                { ...mockBookingHistory[1], bookingStatus: 'CANCELLED' },
                { ...mockBookingHistory[2], bookingStatus: 'FAILED' },
                { ...mockBookingHistory[0], bookingId: 10, bookingStatus: 'PROCESSING' }
            ];

            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: diverseBookings
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
                expect(screen.getByText('Đã hủy')).toBeInTheDocument();
                expect(screen.getByText('Thất bại')).toBeInTheDocument();
                expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
            });
        });

        test('7.6. Xử lý cancelAutoRenew response không có message', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                success: true
            });

            renderComponent();

            await waitFor(() => {
                const cancelButtons = screen.getAllByText('Hủy gia hạn');
                fireEvent.click(cancelButtons[0]);
            });

            await waitFor(() => {
                const confirmButton = screen.getByText('Hủy');
                fireEvent.click(confirmButton);
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Hủy gia hạn tự động thành công!',
                    description: 'Gói thuê pin của bạn sẽ không tự động gia hạn',
                    className: 'bg-green-500 text-white'
                });
            });
        });

        test('7.7. Xử lý userData không có userId', async () => {
            renderComponent({ userId: null });

            await waitFor(() => {
                expect(screen.getByText('Chọn gói phù hợp với bạn')).toBeInTheDocument();
            });

            expect(axiosServices.getDriverSubscription).not.toHaveBeenCalled();
        });

        test('7.8. Xử lý userData undefined', async () => {
            renderComponent(undefined);

            await waitFor(() => {
                expect(screen.getByText('Chọn gói phù hợp với bạn')).toBeInTheDocument();
            });
        });

        test('7.9. Xử lý booking với unknown payment method', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: [{
                    ...mockBookingHistory[0],
                    payment: { paymentMethod: 'UNKNOWN' }
                }]
            });

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('Chưa có lịch sử sử dụng gói thuê bao')).toBeInTheDocument();
            });
        });

        test('7.10. Xử lý response plans với success = true nhưng không có plans field', async () => {
            axiosServices.getAllPlans.mockResolvedValue({
                success: true
            });

            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('Cơ Bản')).not.toBeInTheDocument();
            });

            consoleError.mockRestore();
        });
    });

    // ============================================================
    // 8. NAVIGATION TESTS
    // Mục tiêu: Kiểm tra điều hướng và routing
    // ============================================================
    describe('8. Navigation - Kiểm tra điều hướng', () => {

        test('8.1. Navigate đến checkout khi chọn gói 1', async () => {
            renderComponent();

            await waitFor(() => {
                const selectButtons = screen.getAllByText(/Chọn gói này/i);
                fireEvent.click(selectButtons[0]);

                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[0] }
                });
            });
        });

        test('8.2. Navigate đến checkout khi chọn gói 2', async () => {
            renderComponent();

            await waitFor(() => {
                const selectButtons = screen.getAllByText(/Chọn gói này/i);
                fireEvent.click(selectButtons[1]);

                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[1] }
                });
            });
        });

        test('8.3. Navigate đến checkout khi chọn gói 3', async () => {
            renderComponent();

            await waitFor(() => {
                const selectButtons = screen.getAllByText(/Chọn gói này/i);
                fireEvent.click(selectButtons[2]);

                expect(mockNavigate).toHaveBeenCalledWith('/driver/subscriptions/checkout', {
                    state: { plan: mockPlans[2] }
                });
            });
        });

        test('8.4. Không navigate khi click nút disabled', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();

            await waitFor(() => {
                const disabledButtons = screen.getAllByText(/Đã có gói/i);
                fireEvent.click(disabledButtons[0]);

                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });

        test('8.5. Navigate với đúng plan data structure', async () => {
            renderComponent();

            await waitFor(() => {
                const selectButtons = screen.getAllByText(/Chọn gói này/i);
                fireEvent.click(selectButtons[1]);

                const callArgs = mockNavigate.mock.calls[0];
                expect(callArgs[0]).toBe('/driver/subscriptions/checkout');
                expect(callArgs[1].state.plan).toHaveProperty('planId');
                expect(callArgs[1].state.plan).toHaveProperty('planName');
                expect(callArgs[1].state.plan).toHaveProperty('price');
                expect(callArgs[1].state.plan).toHaveProperty('swapLimit');
            });
        });
    });

    // ============================================================
    // 9. INTEGRATION TESTS
    // Mục tiêu: Kiểm tra flow tích hợp giữa các chức năng
    // ============================================================
    describe('9. Integration - Kiểm tra flow tích hợp', () => {

        test('9.1. Flow hoàn chỉnh: Load data -> Hiển thị plans -> Click plan -> Navigate', async () => {
            renderComponent();

            // 1. Loading state
            expect(screen.getByText('Đang tải danh sách gói...')).toBeInTheDocument();

            // 2. Hiển thị plans sau khi load
            await waitFor(() => {
                expect(screen.getByText('Cơ Bản')).toBeInTheDocument();
            });

            // 3. Click plan
            const selectButtons = screen.getAllByText(/Chọn gói này/i);
            fireEvent.click(selectButtons[0]);

            // 4. Navigate
            expect(mockNavigate).toHaveBeenCalled();
        });

        test('9.2. Flow: Có subscription -> Hiển thị chi tiết -> Hủy auto-renew -> Update UI', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.cancelAutoRenewSubscription.mockResolvedValue({
                success: true,
                message: 'Hủy thành công'
            });

            renderComponent();

            // 1. Hiển thị subscription
            await waitFor(() => {
                expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();
                expect(screen.getByText('Đang bật gia hạn tự động')).toBeInTheDocument();
            });

            // 2. Click hủy gia hạn
            const cancelButtons = screen.getAllByText('Hủy gia hạn');
            fireEvent.click(cancelButtons[0]);

            // 3. Confirm
            await waitFor(() => {
                const confirmButton = screen.getByText('Hủy');
                fireEvent.click(confirmButton);
            });

            // 4. UI update
            await waitFor(() => {
                expect(screen.getByText('Đã tắt tự động gia hạn')).toBeInTheDocument();
            });
        });

        test('9.3. Flow: Load history -> Filter SUBSCRIPTION -> Hiển thị đúng bookings', async () => {
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                // Chỉ hiển thị SUBSCRIPTION bookings
                expect(screen.getByText('Trạm A')).toBeInTheDocument();
                expect(screen.getByText('Trạm B')).toBeInTheDocument();
                expect(screen.getByText('Trạm C')).toBeInTheDocument();

                // Không hiển thị WALLET booking
                expect(screen.queryByText('Trạm D')).not.toBeInTheDocument();
            });
        });

        test('9.4. Flow: API error -> Hiển thị toast -> Vẫn hiển thị UI', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            axiosServices.getAllPlans.mockRejectedValue(new Error('Network error'));

            renderComponent();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Lỗi tải dữ liệu',
                        variant: 'destructive'
                    })
                );
            });

            consoleError.mockRestore();
        });

        test('9.5. Flow: Có subscription -> Tất cả buttons disabled', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });

            renderComponent();

            await waitFor(() => {
                const buttons = screen.getAllByText(/Đã có gói/i);
                expect(buttons.length).toBe(3);
                buttons.forEach(button => {
                    expect(button).toBeDisabled();
                });
            });
        });
    });

    // ============================================================
    // 10. COMPONENT LIFECYCLE TESTS
    // Mục tiêu: Kiểm tra vòng đời component
    // ============================================================
    describe('10. Component Lifecycle - Kiểm tra vòng đời component', () => {

        test('10.1. Component mount gọi tất cả APIs cần thiết', async () => {
            renderComponent();

            await waitFor(() => {
                expect(axiosServices.getAllPlans).toHaveBeenCalled();
                expect(axiosServices.getDriverSubscription).toHaveBeenCalledWith(1);
                expect(axiosServices.getBookingHistoryByUserId).toHaveBeenCalledWith(1);
            });
        });

        test('10.2. Component không gọi subscription API khi không có userId', async () => {
            renderComponent({ userId: null });

            await waitFor(() => {
                expect(axiosServices.getAllPlans).toHaveBeenCalled();
            });

            expect(axiosServices.getDriverSubscription).not.toHaveBeenCalled();
            expect(axiosServices.getBookingHistoryByUserId).not.toHaveBeenCalled();
        });

        test('10.3. Loading state chuyển đổi đúng', async () => {
            renderComponent();

            // Ban đầu: loading = true
            expect(screen.getByText('Đang tải danh sách gói...')).toBeInTheDocument();

            // Sau khi load: loading = false
            await waitFor(() => {
                expect(screen.queryByText('Đang tải danh sách gói...')).not.toBeInTheDocument();
                expect(screen.getByText('Gói thuê pin')).toBeInTheDocument();
            });
        });

        test('10.4. Component render đúng khi có tất cả dữ liệu', async () => {
            axiosServices.getDriverSubscription.mockResolvedValue({
                success: true,
                subscription: mockSubscription
            });
            axiosServices.getBookingHistoryByUserId.mockResolvedValue({
                data: mockBookingHistory
            });

            renderComponent();

            await waitFor(() => {
                // Plans section
                expect(screen.getByText('Cơ Bản')).toBeInTheDocument();

                // Current subscription
                expect(screen.getByText('Gói Tiêu Chuẩn')).toBeInTheDocument();

                // Usage history
                expect(screen.getByText('Trạm A')).toBeInTheDocument();
            });
        });

        test('10.5. useEffect chỉ chạy 1 lần khi component mount', async () => {
            const { rerender } = render(
                <MemoryRouter>
                    <SystemContext.Provider value={{ userData: mockUserData, setUserData: jest.fn() }}>
                        <Subscriptions />
                    </SystemContext.Provider>
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(axiosServices.getAllPlans).toHaveBeenCalledTimes(1);
            });

            // Rerender component
            rerender(
                <MemoryRouter>
                    <SystemContext.Provider value={{ userData: mockUserData, setUserData: jest.fn() }}>
                        <Subscriptions />
                    </SystemContext.Provider>
                </MemoryRouter>
            );

            // Vẫn chỉ gọi 1 lần (vì dependency array rỗng)
            expect(axiosServices.getAllPlans).toHaveBeenCalledTimes(1);
        });
    });
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================
// (Các helper functions được định nghĩa ở cuối để tái sử dụng)
