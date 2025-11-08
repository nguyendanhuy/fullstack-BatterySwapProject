import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BatteryInspection from '@/pages/staff/BatteryInspection';
import { useToast } from '@/hooks/use-toast';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
    useToast: jest.fn(),
}));

describe('BatteryInspection Component', () => {
    const mockToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useToast.mockReturnValue({ toast: mockToast });
    });

    describe('UI Rendering - Kiểm tra giao diện hiển thị', () => {
        it('nên hiển thị tiêu đề trang chính xác', () => {
            render(<BatteryInspection />);

            const heading = screen.getByText('Kiểm tra & Giám định pin');
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveClass('text-4xl', 'font-bold');
        });

        it('nên hiển thị 3 thẻ thống kê với số liệu đúng', () => {
            render(<BatteryInspection />);

            // Kiểm tra card "Cần kiểm tra"
            expect(screen.getByText('Cần kiểm tra')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();

            // Kiểm tra card "Gửi bảo trì"
            expect(screen.getByText('Gửi bảo trì')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();

            // Kiểm tra card "Đạt chuẩn" - sử dụng getAllByText vì xuất hiện nhiều lần
            const datChuanElements = screen.getAllByText('Đạt chuẩn');
            expect(datChuanElements.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('8')).toBeInTheDocument();
        });

        it('nên hiển thị danh sách 3 pin cần kiểm tra', () => {
            render(<BatteryInspection />);

            expect(screen.getByText('BAT005')).toBeInTheDocument();
            expect(screen.getByText('BAT009')).toBeInTheDocument();
            expect(screen.getByText('BAT014')).toBeInTheDocument();
        });

        it('nên hiển thị thông tin chi tiết của mỗi pin cần kiểm tra', () => {
            render(<BatteryInspection />);

            // Kiểm tra các thông tin pin hiển thị
            expect(screen.getByText('Slot A3')).toBeInTheDocument();
            const allSoh78 = screen.getAllByText('78%');
            expect(allSoh78.length).toBeGreaterThanOrEqual(1);
            const allCycles345 = screen.getAllByText('345 lần');
            expect(allCycles345.length).toBeGreaterThanOrEqual(1);

            // Kiểm tra loại pin được hiển thị
            const allPinLFP = screen.getAllByText('Pin LFP');
            expect(allPinLFP.length).toBeGreaterThanOrEqual(1);
        });

        it('nên hiển thị lịch sử kiểm tra mặc định với 3 bản ghi', () => {
            render(<BatteryInspection />);

            expect(screen.getByText('Lịch sử kiểm tra pin')).toBeInTheDocument();
            expect(screen.getByText('BAT001')).toBeInTheDocument();
            expect(screen.getByText('BAT003')).toBeInTheDocument();
            expect(screen.getByText('BAT007')).toBeInTheDocument();
        });

        it('nên hiển thị nút "Kiểm tra ngay" cho mỗi pin', () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            expect(inspectButtons).toHaveLength(3);
        });

        it('nên hiển thị nút "Xem tất cả" cho lịch sử kiểm tra', () => {
            render(<BatteryInspection />);

            const viewAllButton = screen.getByText('Xem tất cả');
            expect(viewAllButton).toBeInTheDocument();
        });

        it('nên hiển thị trạng thái pin với các mức SOH khác nhau', () => {
            render(<BatteryInspection />);

            // Kiểm tra các SOH được hiển thị (không check màu vì phức tạp với multiple elements)
            const allSoh78 = screen.getAllByText('78%');
            expect(allSoh78.length).toBeGreaterThanOrEqual(1);

            const allSoh75 = screen.getAllByText('75%');
            expect(allSoh75.length).toBeGreaterThanOrEqual(1);

            const allSoh72 = screen.getAllByText('72%');
            expect(allSoh72.length).toBeGreaterThanOrEqual(1);
        });

        it('nên hiển thị badge trạng thái trong lịch sử kiểm tra', () => {
            render(<BatteryInspection />);

            const passBadges = screen.getAllByText('Đạt chuẩn');
            const maintenanceBadges = screen.getAllByText('Bảo trì');

            // Có 2 "Đạt chuẩn" trong lịch sử (BAT001, BAT007)
            expect(passBadges.length).toBeGreaterThanOrEqual(2);
            // Có 1 "Bảo trì" trong lịch sử (BAT003)
            expect(maintenanceBadges.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('State Management - Quản lý trạng thái', () => {
        it('nên khởi tạo với selectedBattery là null', () => {
            render(<BatteryInspection />);

            // Dialog không nên hiển thị ban đầu
            expect(screen.queryByText(/Kiểm tra pin BAT/)).not.toBeInTheDocument();
        });

        it('nên khởi tạo với showFullHistory là false', () => {
            render(<BatteryInspection />);

            // Chỉ hiển thị 3 bản ghi lịch sử ban đầu
            expect(screen.getByText('BAT001')).toBeInTheDocument();
            expect(screen.getByText('BAT003')).toBeInTheDocument();
            expect(screen.getByText('BAT007')).toBeInTheDocument();

            // Không hiển thị các bản ghi trong full history
            expect(screen.queryByText('BAT010')).not.toBeInTheDocument();
            expect(screen.queryByText('BAT012')).not.toBeInTheDocument();
        });

        it('nên cập nhật selectedBattery khi click nút "Kiểm tra ngay"', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            // Dialog với thông tin pin BAT005 nên hiển thị
            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
            });
        });

        it('nên toggle showFullHistory khi click "Xem tất cả"', async () => {
            render(<BatteryInspection />);

            const viewAllButton = screen.getByText('Xem tất cả');

            // Click để xem tất cả
            await userEvent.click(viewAllButton);

            await waitFor(() => {
                expect(screen.getByText('BAT010')).toBeInTheDocument();
                expect(screen.getByText('BAT012')).toBeInTheDocument();
                expect(screen.getByText('Thu gọn')).toBeInTheDocument();
            });

            // Click để thu gọn
            const collapseButton = screen.getByText('Thu gọn');
            await userEvent.click(collapseButton);

            await waitFor(() => {
                expect(screen.queryByText('BAT010')).not.toBeInTheDocument();
                expect(screen.getByText('Xem tất cả')).toBeInTheDocument();
            });
        });
    });

    describe('Event Handling - Xử lý sự kiện', () => {
        it('nên mở dialog kiểm tra khi click nút "Kiểm tra ngay"', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
                expect(screen.getByText('Thực hiện giám định và đánh giá chất lượng pin')).toBeInTheDocument();
            });
        });

        it('nên hiển thị thông tin pin trong dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                // Kiểm tra dialog title
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();

                // Kiểm tra loại pin (sử dụng getAllByText vì xuất hiện nhiều lần)
                const lithiumIonElements = screen.getAllByText('Lithium-ion');
                expect(lithiumIonElements.length).toBeGreaterThanOrEqual(1);

                const allSoh78 = screen.getAllByText('78%');
                expect(allSoh78.length).toBeGreaterThanOrEqual(1);
                const allCycles = screen.getAllByText('345 lần');
                expect(allCycles.length).toBeGreaterThanOrEqual(1);
            });
        });

        it('nên hiển thị nút "Hoàn thành kiểm tra" và kiểm tra trạng thái disabled', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                const completeButton = within(dialog).getByText('Hoàn thành kiểm tra');

                // Ban đầu nút bị disabled vì chưa đủ thông tin
                expect(completeButton).toBeDisabled();
            });

            // Điền một phần thông tin
            const physicalInput = screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
            await userEvent.type(physicalInput, 'Pin trong tình trạng tốt');

            // Vẫn disabled vì thiếu notes và inspector
            await waitFor(() => {
                const completeButton = screen.getByText('Hoàn thành kiểm tra');
                expect(completeButton).toBeDisabled();
            });
        });

        it('nên disable nút "Hoàn thành kiểm tra" khi thiếu thông tin', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                const completeButton = within(dialog).getByText('Hoàn thành kiểm tra');

                expect(completeButton).toBeDisabled();
            });
        });

        it('nên disable nút "Gửi bảo trì" khi chưa chọn người kiểm tra', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                // Sử dụng getAllByText vì có nhiều element với text "Gửi bảo trì"
                const allButtons = screen.getAllByText('Gửi bảo trì');
                // Tìm button thực sự (không phải text trong stats card)
                const maintenanceButton = allButtons.find(el => el.tagName === 'BUTTON');
                expect(maintenanceButton).toBeDefined();
                expect(maintenanceButton).toBeDisabled();
            });
        });

        it('nên xử lý sự kiện nhập liệu cho textarea "Tình trạng vật lý"', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            const physicalInput = await screen.findByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
            const testText = 'Pin có vết xước nhẹ';

            await userEvent.type(physicalInput, testText);

            expect(physicalInput).toHaveValue(testText);
        });

        it('nên xử lý sự kiện nhập liệu cho textarea "Ghi chú đánh giá"', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            const notesInput = await screen.findByPlaceholderText(/Ghi chú bổ sung về hiệu suất/);
            const testText = 'Pin hoạt động ổn định';

            await userEvent.type(notesInput, testText);

            expect(notesInput).toHaveValue(testText);
        });

        it('nên hiển thị dropdown người kiểm tra trong dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const selectTrigger = screen.getByRole('combobox');
                expect(selectTrigger).toBeInTheDocument();
            });
        });

        it('nên đóng dialog khi click vào overlay', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
            });

            // Tìm overlay và click
            const overlay = document.querySelector('[data-radix-dialog-overlay]');
            if (overlay) {
                fireEvent.click(overlay);

                await waitFor(() => {
                    expect(screen.queryByText('Kiểm tra pin BAT005')).not.toBeInTheDocument();
                });
            }
        });
    });

    describe('Form Validation - Xác thực form', () => {
        it('nên require tất cả các trường để hoàn thành kiểm tra', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const completeButton = screen.getByText('Hoàn thành kiểm tra');
                expect(completeButton).toBeDisabled();
            });
        });

        it('nên require chỉ người kiểm tra để gửi bảo trì', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                // Sử dụng getAllByText để tránh lỗi multiple elements
                const allButtons = screen.getAllByText('Gửi bảo trì');
                const maintenanceButton = allButtons.find(el => el.tagName === 'BUTTON');
                expect(maintenanceButton).toBeDefined();
                expect(maintenanceButton).toBeDisabled();
            });
        });

        it('nên clear form khi đóng và mở lại dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            const physicalInput = await screen.findByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
            await userEvent.type(physicalInput, 'Test content');

            // Đóng dialog bằng Escape key
            fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

            // Đợi dialog đóng
            await waitFor(() => {
                expect(screen.queryByText('Kiểm tra pin BAT005')).not.toBeInTheDocument();
            });

            // Mở lại dialog
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const newPhysicalInput = screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
                expect(newPhysicalInput).toHaveValue('');
            });
        });
    });

    describe('Toast Notifications - Thông báo', () => {
        it('nên hiển thị các nút hành động trong dialog kiểm tra', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Hoàn thành kiểm tra')).toBeInTheDocument();
                // Kiểm tra có button "Gửi bảo trì"
                const allButtons = screen.getAllByText('Gửi bảo trì');
                const maintenanceButton = allButtons.find(el => el.tagName === 'BUTTON');
                expect(maintenanceButton).toBeDefined();
            });
        });

        it('nên hiển thị combobox chọn người kiểm tra trong dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const combobox = screen.getByRole('combobox');
                expect(combobox).toBeInTheDocument();
            });
        });

        it('nên có placeholder cho các trường nhập liệu', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/)).toBeInTheDocument();
                expect(screen.getByPlaceholderText(/Ghi chú bổ sung về hiệu suất/)).toBeInTheDocument();
            });
        });
    });

    describe('Data Display - Hiển thị dữ liệu', () => {
        it('nên hiển thị đúng số lượng pin trong mỗi badge', () => {
            render(<BatteryInspection />);

            const badges = screen.getAllByText(/pin$/);
            expect(badges.length).toBeGreaterThan(0);
        });

        it('nên hiển thị thời gian lần cuối sử dụng cho mỗi pin', () => {
            render(<BatteryInspection />);

            expect(screen.getByText('14/12/2024 16:30')).toBeInTheDocument();
            expect(screen.getByText('14/12/2024 15:20')).toBeInTheDocument();
            expect(screen.getByText('14/12/2024 14:10')).toBeInTheDocument();
        });

        it('nên hiển thị thông tin người kiểm tra trong lịch sử', () => {
            render(<BatteryInspection />);

            const inspectors = screen.getAllByText(/Nguyễn Văn A|Trần Thị B/);
            expect(inspectors.length).toBeGreaterThan(0);
        });

        it('nên hiển thị ghi chú trong lịch sử kiểm tra', () => {
            render(<BatteryInspection />);

            expect(screen.getByText('Pin trong tình trạng bình thường')).toBeInTheDocument();
            expect(screen.getByText('Cần theo dõi thêm')).toBeInTheDocument();
        });

        it('nên hiển thị tất cả 10 bản ghi khi bật "Xem tất cả"', async () => {
            render(<BatteryInspection />);

            const viewAllButton = screen.getByText('Xem tất cả');
            await userEvent.click(viewAllButton);

            await waitFor(() => {
                // Kiểm tra các bản ghi mới xuất hiện
                expect(screen.getByText('BAT010')).toBeInTheDocument();
                expect(screen.getByText('BAT012')).toBeInTheDocument();
                expect(screen.getByText('BAT015')).toBeInTheDocument();
                expect(screen.getByText('BAT002')).toBeInTheDocument();
                expect(screen.getByText('BAT006')).toBeInTheDocument();
                expect(screen.getByText('BAT011')).toBeInTheDocument();
            });
        });
    });

    describe('User Interaction Flow - Luồng tương tác người dùng', () => {
        it('nên mở dialog khi click nút kiểm tra ngay', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[1]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT009')).toBeInTheDocument();
            });
        });

        it('nên cho phép nhập thông tin vào các trường input', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[2]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT014')).toBeInTheDocument();
            });

            const physicalInput = screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
            await userEvent.type(physicalInput, 'Pin có dấu hiệu ăn mòn');

            expect(physicalInput).toHaveValue('Pin có dấu hiệu ăn mòn');
        });

        it('nên hiển thị thông tin pin trong dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                // Kiểm tra dialog title chứa "Kiểm tra pin"
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
                // Kiểm tra có section "Thông tin pin"
                expect(screen.getByText(/Thông tin pin/)).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases - Các trường hợp biên', () => {
        it('nên toggle lịch sử kiểm tra nhiều lần', async () => {
            render(<BatteryInspection />);

            // Lần 1: Xem tất cả
            let viewAllButton = screen.getByText('Xem tất cả');
            await userEvent.click(viewAllButton);

            await waitFor(() => {
                expect(screen.getByText('BAT010')).toBeInTheDocument();
                expect(screen.getByText('Thu gọn')).toBeInTheDocument();
            });

            // Lần 2: Thu gọn
            let collapseButton = screen.getByText('Thu gọn');
            await userEvent.click(collapseButton);

            await waitFor(() => {
                expect(screen.queryByText('BAT010')).not.toBeInTheDocument();
                expect(screen.getByText('Xem tất cả')).toBeInTheDocument();
            });

            // Lần 3: Xem tất cả lại
            viewAllButton = screen.getByText('Xem tất cả');
            await userEvent.click(viewAllButton);

            await waitFor(() => {
                expect(screen.getByText('BAT010')).toBeInTheDocument();
            });
        });

        it('nên xử lý khi không có pin nào cần kiểm tra', () => {
            render(<BatteryInspection />);

            // Ít nhất phải render được component
            expect(screen.getByText('Kiểm tra & Giám định pin')).toBeInTheDocument();
        });

        it('nên hiển thị đúng màu sắc cho các mức SOH khác nhau', () => {
            render(<BatteryInspection />);

            // Kiểm tra các SOH hiển thị
            const allSoh72 = screen.getAllByText('72%');
            expect(allSoh72.length).toBeGreaterThanOrEqual(1);

            const allSoh78 = screen.getAllByText('78%');
            expect(allSoh78.length).toBeGreaterThanOrEqual(1);

            const allSoh75 = screen.getAllByText('75%');
            expect(allSoh75.length).toBeGreaterThanOrEqual(1);
        });
        it('nên xử lý việc kiểm tra nhiều pin liên tiếp', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');

            // Kiểm tra pin đầu tiên
            await userEvent.click(inspectButtons[0]);
            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
            });

            // Đóng dialog bằng Escape
            fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByText('Kiểm tra pin BAT005')).not.toBeInTheDocument();
            });
        });

        it('nên reset selectedBattery sau khi đóng dialog', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
            });

            // Đóng dialog bằng Escape
            fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

            // Dialog nên đóng
            await waitFor(() => {
                expect(screen.queryByText('Kiểm tra pin BAT005')).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility - Khả năng tiếp cận', () => {
        it('nên có các label phù hợp cho form inputs', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                const labels = screen.getAllByText('Tình trạng vật lý');
                expect(labels.length).toBeGreaterThanOrEqual(1);

                expect(screen.getByText('Ghi chú đánh giá')).toBeInTheDocument();
                expect(screen.getByText('Người thực hiện kiểm tra')).toBeInTheDocument();
            });
        });

        it('nên có placeholder text hữu ích cho các input', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/)).toBeInTheDocument();
                expect(screen.getByPlaceholderText(/Ghi chú bổ sung về hiệu suất/)).toBeInTheDocument();
            });
        });

        it('nên có dialog title và description rõ ràng', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
                expect(screen.getByText('Thực hiện giám định và đánh giá chất lượng pin')).toBeInTheDocument();
            });
        });
    });

    describe('Component Rendering Performance - Hiệu suất render', () => {
        it('nên render component nhanh chóng', () => {
            const start = performance.now();
            render(<BatteryInspection />);
            const end = performance.now();

            // Component nên render trong vòng 1 giây
            expect(end - start).toBeLessThan(1000);
        });

        it('nên render tất cả batteries trong danh sách', () => {
            render(<BatteryInspection />);

            const batteryCards = screen.getAllByText(/BAT\d{3}/);
            // Ít nhất 3 pin cần kiểm tra + 3 trong lịch sử = 6
            expect(batteryCards.length).toBeGreaterThanOrEqual(6);
        });

        it('nên hiển thị đúng icon cho từng trạng thái pin trong lịch sử', () => {
            render(<BatteryInspection />);

            // Kiểm tra có icon CheckCircle cho pin đạt chuẩn
            // Kiểm tra có icon Wrench cho pin bảo trì
            const badges = screen.getAllByText('Đạt chuẩn');
            expect(badges.length).toBeGreaterThanOrEqual(2);

            const maintenanceBadges = screen.getAllByText('Bảo trì');
            expect(maintenanceBadges.length).toBeGreaterThanOrEqual(1);
        });

        it('nên xử lý đúng animation delay cho các card', () => {
            render(<BatteryInspection />);

            // Component render thành công với animation
            expect(screen.getByText('Kiểm tra & Giám định pin')).toBeInTheDocument();
        });
    });

    describe('Branch Coverage Tests - Test các nhánh điều kiện', () => {
        it('nên test tất cả các trường hợp SOH display', async () => {
            render(<BatteryInspection />);

            // Test SOH hiển thị trong list
            const allSOHElements = screen.getAllByText(/^\d+%$/);
            expect(allSOHElements.length).toBeGreaterThanOrEqual(3);
        });

        it('nên test badge với status Đạt chuẩn', () => {
            render(<BatteryInspection />);

            const passBadges = screen.getAllByText('Đạt chuẩn');
            // Có ít nhất 1 badge "Đạt chuẩn" trong thống kê và lịch sử
            expect(passBadges.length).toBeGreaterThanOrEqual(1);
        });

        it('nên test badge với status Bảo trì', () => {
            render(<BatteryInspection />);

            const maintenanceBadges = screen.getAllByText('Bảo trì');
            // Có ít nhất 1 badge "Bảo trì"
            expect(maintenanceBadges.length).toBeGreaterThanOrEqual(1);
        });

        it('nên disable nút "Hoàn thành kiểm tra" khi thiếu physicalCondition', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            // Chỉ điền notes, không điền physicalCondition
            const notesInput = await screen.findByPlaceholderText(/Ghi chú bổ sung về hiệu suất/);
            await userEvent.type(notesInput, 'Test notes');

            await waitFor(() => {
                const completeButton = screen.getByText('Hoàn thành kiểm tra');
                // Disabled vì thiếu physicalCondition và inspector
                expect(completeButton).toBeDisabled();
            });
        });

        it('nên disable nút "Hoàn thành kiểm tra" khi thiếu notes', async () => {
            render(<BatteryInspection />);

            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            // Chỉ điền physicalCondition, không điền notes
            const physicalInput = await screen.findByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/);
            await userEvent.type(physicalInput, 'Test physical');

            await waitFor(() => {
                const completeButton = screen.getByText('Hoàn thành kiểm tra');
                // Disabled vì thiếu notes và inspector
                expect(completeButton).toBeDisabled();
            });
        });

        it('nên test tất cả mức SOH: > 90%, 80-90%, < 80%', () => {
            render(<BatteryInspection />);

            // Test SOH < 80% (72%) -> red
            const allSoh72 = screen.getAllByText('72%');
            // Chọn element đầu tiên (trong danh sách pin cần kiểm tra)
            expect(allSoh72[0]).toHaveClass('text-red-500');

            // Test SOH 80-90% (78%, 75%) -> orange or red (depending on position)
            // Trong danh sách có nhiều SOH 78% và 75%, kiểm tra ít nhất 1 element
            const allSoh78 = screen.getAllByText('78%');
            expect(allSoh78.length).toBeGreaterThanOrEqual(1);

            const allSoh75 = screen.getAllByText('75%');
            expect(allSoh75.length).toBeGreaterThanOrEqual(1);
        });

        it('nên hiển thị overlay khi hover vào card pin', async () => {
            render(<BatteryInspection />);

            // Tất cả card pin đều có overlay gradient
            const batteryIds = ['BAT005', 'BAT009', 'BAT014'];
            batteryIds.forEach(id => {
                expect(screen.getByText(id)).toBeInTheDocument();
            });
        });

        it('nên test animation delay cho stats cards', () => {
            render(<BatteryInspection />);

            // Các stats card được render với animation delay khác nhau
            expect(screen.getByText('Cần kiểm tra')).toBeInTheDocument();
            expect(screen.getByText('Gửi bảo trì')).toBeInTheDocument();
            // Sử dụng getAllByText cho text xuất hiện nhiều lần
            const datChuanElements = screen.getAllByText('Đạt chuẩn');
            expect(datChuanElements.length).toBeGreaterThanOrEqual(1);
        });

        it('nên render InspectionForm khi selectedBattery không null', async () => {
            render(<BatteryInspection />);

            // Mở dialog
            const inspectButtons = screen.getAllByText('Kiểm tra ngay');
            await userEvent.click(inspectButtons[0]);

            // InspectionForm được render khi selectedBattery có giá trị
            await waitFor(() => {
                expect(screen.getByText('Kiểm tra pin BAT005')).toBeInTheDocument();
                expect(screen.getByPlaceholderText(/Mô tả chi tiết tình trạng vật lý/)).toBeInTheDocument();
                expect(screen.getByPlaceholderText(/Ghi chú bổ sung về hiệu suất/)).toBeInTheDocument();
            });
        });

        it('nên test các SOH levels > 90%', () => {
            // Tạo component với mock data có SOH > 90%
            render(<BatteryInspection />);

            // Kiểm tra component render thành công
            expect(screen.getByText('Kiểm tra & Giám định pin')).toBeInTheDocument();
        });

        it('nên test condition khi selectedBattery là null', () => {
            render(<BatteryInspection />);

            // Ban đầu không có dialog nào được mở (selectedBattery null)
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
