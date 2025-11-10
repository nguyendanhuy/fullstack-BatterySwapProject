import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Wallet from '../pages/driver/Wallet';
import { SystemContext } from '../contexts/system.context';
import * as axiosServices from '../services/axios.services';
import { toast } from 'sonner';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

// Mock axios services
jest.mock('../services/axios.services', () => ({
    depositSystemWallet: jest.fn()
}));

describe('Wallet Component - Coverage Tests', () => {
    const mockUserData = {
        userId: 1,
        email: 'test@example.com',
        walletBalance: 500000
    };

    const renderComponent = (userData = mockUserData) => {
        return render(
            <MemoryRouter>
                <SystemContext.Provider value={{ userData, setUserData: jest.fn() }}>
                    <Wallet />
                </SystemContext.Provider>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        toast.success.mockClear();
        toast.error.mockClear();
        mockNavigate.mockClear();

        // Mock window.location
        delete window.location;
        window.location = {
            href: '',
            search: '',
            pathname: '/driver/wallet'
        };
        window.history.replaceState = jest.fn();
    });

    // ============================================================
    // 1. UI RENDERING
    // ============================================================
    describe('1. UI Rendering', () => {
        test('1.1. Hiển thị header và số dư', () => {
            renderComponent();
            expect(screen.getByText('Ví điện tử')).toBeInTheDocument();
            // Text '500.000 ₫' appears in both balance and button - check balance specifically
            expect(screen.getByText('Số dư khả dụng')).toBeInTheDocument();
            expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
        });

        test('1.2. Hiển thị suggested amounts', () => {
            renderComponent();
            expect(screen.getByRole('button', { name: '50.000 ₫' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '100.000 ₫' })).toBeInTheDocument();
        });

        test('1.3. Hiển thị input và nút nạp tiền', () => {
            renderComponent();
            expect(screen.getByPlaceholderText('Nhập số tiền (VNĐ)')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Nạp tiền/ })).toBeInTheDocument();
        });
    });

    // ============================================================
    // 2. DEPOSIT FUNCTIONALITY
    // ============================================================
    describe('2. Deposit Functionality', () => {
        test('2.1. Click suggested amount cập nhật input', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '100.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('100000');
        });

        test('2.2. Nhập custom amount', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '250000' } });
            expect(input.value).toBe('250000');
        });

        test('2.3. Deposit thành công - redirect to VNPay', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: true,
                paymentUrl: 'https://vnpay.test.com/payment'
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(axiosServices.depositSystemWallet).toHaveBeenCalledWith(100000);
            });

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Đang chuyển đến cổng thanh toán...');
            });
        });

        test('2.4. Deposit thất bại - hiển thị error message', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: false,
                message: 'Hệ thống lỗi'
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Hệ thống lỗi');
            });
        });

        test('2.5. Deposit thất bại - không có message fallback', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: false
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Không thể tạo link thanh toán');
            });
        });

        test('2.6. Deposit API error', async () => {
            axiosServices.depositSystemWallet.mockRejectedValue({ message: 'Network error' });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Network error');
            });
        });

        test('2.7. Deposit API error - không có message', async () => {
            axiosServices.depositSystemWallet.mockRejectedValue({});

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi nạp tiền');
            });
        });
    });

    // ============================================================
    // 3. VALIDATION
    // ============================================================
    describe('3. Validation', () => {
        test('3.1. Số tiền < 10000 - hiển thị error', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '5000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            expect(toast.error).toHaveBeenCalledWith('Số tiền nạp tối thiểu là 10.000 ₫');
        });

        test('3.2. Số tiền = 0 - button bị disabled', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '0' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            expect(depositButton).toBeDisabled();
        });

        test('3.3. Số tiền âm - hiển thị error', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '-100' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            expect(toast.error).toHaveBeenCalledWith('Số tiền nạp tối thiểu là 10.000 ₫');
        });

        test('3.4. Input rỗng - button bị disabled', () => {
            renderComponent();
            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            expect(depositButton).toBeDisabled();
        });
    });

    // ============================================================
    // 4. USER BALANCE DISPLAY
    // ============================================================
    describe('4. User Balance Display', () => {
        test('4.1. Hiển thị số dư đúng định dạng', () => {
            renderComponent();
            const balanceHeadings = screen.getAllByText('500.000 ₫');
            // Có cả <h2> (số dư) và <button> (suggested amount) có text này
            expect(balanceHeadings.length).toBeGreaterThan(0);
            expect(balanceHeadings[0]).toBeInTheDocument();
        });

        test('4.2. Hiển thị email người dùng', () => {
            renderComponent();
            expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
        });

        test('4.3. Hiển thị số dư = 0', () => {
            const userWithZeroBalance = { ...mockUserData, walletBalance: 0 };
            renderComponent(userWithZeroBalance);
            expect(screen.getByText('0 ₫')).toBeInTheDocument();
        });

        test('4.4. Hiển thị số dư lớn', () => {
            const userWithLargeBalance = { ...mockUserData, walletBalance: 10000000 };
            renderComponent(userWithLargeBalance);
            const balanceHeadings = screen.getAllByText('10.000.000 ₫');
            // Có cả <h2> (số dư) và <button> (suggested amount) có text này
            expect(balanceHeadings.length).toBeGreaterThan(0);
            expect(balanceHeadings[0]).toBeInTheDocument();
        });
    });

    // ============================================================
    // 5. SUGGESTED AMOUNTS INTERACTION
    // ============================================================
    describe('5. Suggested Amounts Interaction', () => {
        test('5.1. Click 50.000 ₫', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '50.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('50000');
        });

        test('5.2. Click 100.000 ₫', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '100.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('100000');
        });

        test('5.3. Click 200.000 ₫', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '200.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('200000');
        });

        test('5.4. Click 500.000 ₫', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '500.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('500000');
        });

        test('5.5. Click suggested amount rồi nhập custom', () => {
            renderComponent();
            const suggested = screen.getByRole('button', { name: '100.000 ₫' });
            fireEvent.click(suggested);

            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            expect(input.value).toBe('100000');

            fireEvent.change(input, { target: { value: '350000' } });
            expect(input.value).toBe('350000');
        });
    });

    // ============================================================
    // 6. DEPOSIT BUTTON STATE
    // ============================================================
    describe('6. Deposit Button State', () => {
        test('6.1. Button disabled khi đang xử lý', async () => {
            axiosServices.depositSystemWallet.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    success: true,
                    paymentUrl: 'https://vnpay.test.com/payment'
                }), 100))
            );

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            // Button should be disabled during processing
            await waitFor(() => {
                expect(depositButton).toBeDisabled();
            });
        });

        test('6.2. Button disabled ban đầu (do input rỗng)', () => {
            renderComponent();
            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            expect(depositButton).toBeDisabled();
        });
    });

    // ============================================================
    // 7. INPUT FORMATTING
    // ============================================================
    describe('7. Input Formatting', () => {
        test('7.1. Nhập số hợp lệ', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '123456' } });
            expect(input.value).toBe('123456');
        });

        test('7.2. Xóa input', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });
            expect(input.value).toBe('100000');

            fireEvent.change(input, { target: { value: '' } });
            expect(input.value).toBe('');
        });

        test('7.3. Nhập số lớn (1 triệu)', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '1000000' } });
            expect(input.value).toBe('1000000');
        });

        test('7.4. Nhập số nhỏ (9999)', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '9999' } });
            expect(input.value).toBe('9999');
        });
    });

    // ============================================================
    // 8. EDGE CASES
    // ============================================================
    describe('8. Edge Cases', () => {
        test('8.1. Deposit chính xác 10.000 ₫ (giá trị tối thiểu)', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: true,
                paymentUrl: 'https://vnpay.test.com/payment'
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '10000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(axiosServices.depositSystemWallet).toHaveBeenCalledWith(10000);
            });
        });

        test('8.2. Deposit 9.999 ₫ (dưới tối thiểu)', () => {
            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '9999' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            expect(toast.error).toHaveBeenCalledWith('Số tiền nạp tối thiểu là 10.000 ₫');
        });

        test('8.3. Deposit số tiền rất lớn', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: true,
                paymentUrl: 'https://vnpay.test.com/payment'
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '50000000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(axiosServices.depositSystemWallet).toHaveBeenCalledWith(50000000);
            });
        });

        test('8.4. API trả về null paymentUrl', async () => {
            axiosServices.depositSystemWallet.mockResolvedValue({
                success: true,
                paymentUrl: null
            });

            renderComponent();
            const input = screen.getByPlaceholderText('Nhập số tiền (VNĐ)');
            fireEvent.change(input, { target: { value: '100000' } });

            const depositButton = screen.getByRole('button', { name: /Nạp tiền/ });
            fireEvent.click(depositButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Không thể tạo link thanh toán');
            });
        });
    });

    // ============================================================
    // 9. NAVIGATION
    // ============================================================
    describe('9. Navigation', () => {
        test('9.1. Hiển thị nút Trang chủ', () => {
            renderComponent();
            const homeLink = screen.getByText('Trang chủ');
            expect(homeLink).toBeInTheDocument();
        });

        test('9.2. Home link có href đúng', () => {
            renderComponent();
            const homeLink = screen.getByText('Trang chủ').closest('a');
            expect(homeLink).toHaveAttribute('href', '/driver');
        });
    });
});
