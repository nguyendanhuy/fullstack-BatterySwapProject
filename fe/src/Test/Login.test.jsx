import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SystemContext } from "../contexts/system.context";

// ----- Mocks -----
// Mock image files
jest.mock("@/assets/auth-background.jpg", () => "auth-background.jpg");

// Import Login after mocking assets
import Login from "../pages/Login";

const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
    useToast: () => ({ toast: mockToast }),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
    const actual = jest.requireActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        Link: ({ children, to }) => <a href={to}>{children}</a>,
    };
});

jest.mock("../services/axios.services", () => ({
    loginAPI: jest.fn(),
    loginByGoogleAPI: jest.fn(),
    forgotPasswordAPI: jest.fn(),
}));

// Mock Google Login component
jest.mock("@react-oauth/google", () => ({
    GoogleLogin: ({ onSuccess, onError }) => (
        <div data-testid="google-login">
            <button onClick={() => onSuccess({ credential: "mock-google-token" })}>
                Google Success
            </button>
            <button onClick={() => onError()}>Google Error</button>
        </div>
    ),
}));

// Mock MouseSparkles component
jest.mock("@/components/MouseSparkles", () => ({
    MouseSparkles: () => <div data-testid="mouse-sparkles" />,
}));

// ---- Helpers ----
const fillValidCredentials = () => {
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
        target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
        target: { value: "123456" },
    });
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: /^Đăng nhập$/i }));

const mockSetUserData = jest.fn();

const renderUI = () =>
    render(
        <MemoryRouter>
            <SystemContext.Provider value={{ setUserData: mockSetUserData }}>
                <Login />
            </SystemContext.Provider>
        </MemoryRouter>
    );

describe("Login page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        window.open = jest.fn();
    });

    // ===== 1. TEST UI RENDERING =====
    test("renders login form with all UI elements", () => {
        renderUI();
        expect(screen.getByText(/EV Battery Swap/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nhập mật khẩu")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Đăng nhập$/i })).toBeInTheDocument();
        expect(screen.getByText(/Đăng ký ngay/i)).toBeInTheDocument();
    });

    test("clears token from localStorage on mount", () => {
        localStorage.setItem("token", "old-token");
        renderUI();
        expect(localStorage.getItem("token")).toBeNull();
    });

    // ===== 2. TEST STATE UPDATE =====
    test("updates email input value on change", () => {
        renderUI();
        const emailInput = screen.getByPlaceholderText("your@email.com");
        fireEvent.change(emailInput, { target: { value: "user@test.com" } });
        expect(emailInput.value).toBe("user@test.com");
    });

    test("updates password input value on change", () => {
        renderUI();
        const passwordInput = screen.getByPlaceholderText("Nhập mật khẩu");
        fireEvent.change(passwordInput, { target: { value: "mypassword" } });
        expect(passwordInput.value).toBe("mypassword");
    });

    // ===== 3. TEST SỰ KIỆN =====
    test("toggles password visibility when eye icon is clicked", () => {
        renderUI();
        const passwordInput = screen.getByPlaceholderText("Nhập mật khẩu");
        expect(passwordInput).toHaveAttribute("type", "password");

        const toggleButtons = screen.getAllByRole("button");
        const eyeButton = toggleButtons.find((btn) => btn.className.includes("absolute"));
        fireEvent.click(eyeButton);
        expect(passwordInput).toHaveAttribute("type", "text");

        fireEvent.click(eyeButton);
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    // ===== 4. TEST VALIDATION ERRORS =====
    test("shows error when password is less than 6 characters", async () => {
        renderUI();
        fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
            target: { value: "12345" },
        });
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Lỗi",
                    description: "Mật khẩu phải có ít nhất 6 ký tự",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 5. TEST API CALLS - LOGIN SUCCESS =====
    test("successful login with DRIVER role navigates to /driver", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "mock-token",
            fullName: "Test Driver",
            email: "driver@test.com",
            role: "DRIVER",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(loginAPI).toHaveBeenCalledWith("test@example.com", "123456");
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thành công!",
                })
            );
            expect(localStorage.getItem("token")).toBe("mock-token");
            expect(mockNavigate).toHaveBeenCalledWith("/driver");
        });
    });

    test("successful login with STAFF role navigates to /staff", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "staff-token",
            fullName: "Test Staff",
            role: "STAFF",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/staff");
        });
    });

    test("successful login with ADMIN role navigates to /admin", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "admin-token",
            fullName: "Test Admin",
            role: "ADMIN",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/admin");
        });
    });

    test("successful login without fullName uses email in toast", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "mock-token",
            email: "test@example.com",
            role: "DRIVER",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thành công!",
                    description: expect.stringContaining("test@example.com"),
                })
            );
        });
    });

    test("successful login with unknown role navigates to /", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "token",
            fullName: "User",
            role: "UNKNOWN",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    // ===== 6. TEST API CALLS - LOGIN FAILURE =====
    test("shows error when API returns auth error message", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            messages: { auth: "Email hoặc mật khẩu không đúng" },
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại!",
                    description: "Email hoặc mật khẩu không đúng",
                    variant: "destructive",
                })
            );
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    test("shows error when API returns business error", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            messages: { business: "Tài khoản đã bị khóa" },
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại!",
                    description: "Tài khoản đã bị khóa",
                    variant: "destructive",
                })
            );
        });
    });

    test("shows error when API returns error field", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            error: "Server error",
        });

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại!",
                    description: "Server error",
                    variant: "destructive",
                })
            );
        });
    });

    test("shows generic error when API throws exception", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockRejectedValueOnce(new Error("Network error"));

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại!",
                    description: "Vui lòng thử lại sau",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 7. TEST LOADING STATE =====
    test("button is disabled and shows loading text during login", async () => {
        const { loginAPI } = require("../services/axios.services");
        let resolveFn;
        loginAPI.mockReturnValue(new Promise((resolve) => (resolveFn = resolve)));

        renderUI();
        fillValidCredentials();
        submit();

        await waitFor(() => {
            const button = screen.getByRole("button", { name: /Đang đăng nhập/i });
            expect(button).toBeDisabled();
        });

        resolveFn({ token: "mock-token", role: "DRIVER" });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    // ===== 8. TEST GOOGLE LOGIN =====
    test("successful Google login navigates to correct page", async () => {
        const { loginByGoogleAPI } = require("../services/axios.services");
        loginByGoogleAPI.mockResolvedValueOnce({
            token: "google-token",
            fullName: "Google User",
            role: "DRIVER",
        });

        renderUI();
        const googleSuccessButton = screen.getByText("Google Success");
        fireEvent.click(googleSuccessButton);

        await waitFor(() => {
            expect(loginByGoogleAPI).toHaveBeenCalledWith({ token: "mock-google-token" });
            expect(mockNavigate).toHaveBeenCalledWith("/driver");
        });
    });

    test("shows error when Google login fails with error response", async () => {
        const { loginByGoogleAPI } = require("../services/axios.services");
        loginByGoogleAPI.mockResolvedValueOnce({
            messages: { auth: "Tài khoản Google chưa được đăng ký" },
        });

        renderUI();
        fireEvent.click(screen.getByText("Google Success"));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại!",
                    variant: "destructive",
                })
            );
        });
    });

    test("shows error when Google login throws exception", async () => {
        const { loginByGoogleAPI } = require("../services/axios.services");
        loginByGoogleAPI.mockRejectedValueOnce(new Error("Google error"));

        renderUI();
        fireEvent.click(screen.getByText("Google Success"));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập Google thất bại!",
                    variant: "destructive",
                })
            );
        });
    });

    test("shows error when Google login onError callback is triggered", async () => {
        renderUI();
        fireEvent.click(screen.getByText("Google Error"));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Đăng nhập thất bại",
                    description: "Không thể đăng nhập với Google",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 9. TEST FORGOT PASSWORD =====
    test("opens forgot password dialog when clicking reset link", () => {
        renderUI();
        const resetLink = screen.getByText("Đặt lại");
        fireEvent.click(resetLink);
        expect(screen.getByText("Đặt lại mật khẩu")).toBeInTheDocument();
    });

    test("shows error when submitting forgot password with empty email", async () => {
        const { forgotPasswordAPI } = require("../services/axios.services");

        renderUI();
        fireEvent.click(screen.getByText("Đặt lại"));

        await waitFor(() => {
            expect(screen.getByText("Đặt lại mật khẩu")).toBeInTheDocument();
        });

        const sendButton = screen.getByRole("button", { name: /Gửi liên kết/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Lỗi",
                    description: "Vui lòng nhập email",
                    variant: "destructive",
                })
            );
        });

        expect(forgotPasswordAPI).not.toHaveBeenCalled();
    });

    test("successful forgot password request shows success message", async () => {
        const { forgotPasswordAPI } = require("../services/axios.services");
        forgotPasswordAPI.mockResolvedValueOnce({ success: true });

        renderUI();
        fireEvent.click(screen.getByText("Đặt lại"));

        await waitFor(() => {
            expect(screen.getByText("Đặt lại mật khẩu")).toBeInTheDocument();
        });

        const forgotEmailInput = document.getElementById("forgot-email");
        fireEvent.change(forgotEmailInput, { target: { value: "reset@test.com" } });

        const sendButton = screen.getByRole("button", { name: /Gửi liên kết/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(forgotPasswordAPI).toHaveBeenCalledWith("reset@test.com");
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Yêu cầu thành công!",
                })
            );
        });
    });

    test("shows error when forgot password API returns error", async () => {
        const { forgotPasswordAPI } = require("../services/axios.services");
        forgotPasswordAPI.mockResolvedValueOnce({
            error: "Email không tồn tại",
        });

        renderUI();
        fireEvent.click(screen.getByText("Đặt lại"));

        await waitFor(() => {
            expect(screen.getByText("Đặt lại mật khẩu")).toBeInTheDocument();
        });

        const forgotEmailInput = document.getElementById("forgot-email");
        fireEvent.change(forgotEmailInput, { target: { value: "notfound@test.com" } });

        const sendButton = screen.getByRole("button", { name: /Gửi liên kết/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Yêu cầu thất bại!",
                    description: "Email không tồn tại",
                    variant: "destructive",
                })
            );
        });
    });

    test("shows error when forgot password API throws exception", async () => {
        const { forgotPasswordAPI } = require("../services/axios.services");
        forgotPasswordAPI.mockRejectedValueOnce(new Error("Server down"));

        renderUI();
        fireEvent.click(screen.getByText("Đặt lại"));

        await waitFor(() => {
            expect(screen.getByText("Đặt lại mật khẩu")).toBeInTheDocument();
        });

        const forgotEmailInput = document.getElementById("forgot-email");
        fireEvent.change(forgotEmailInput, { target: { value: "test@test.com" } });

        const sendButton = screen.getByRole("button", { name: /Gửi liên kết/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Yêu cầu thất bại!",
                    variant: "destructive",
                })
            );
        });
    });

    // ===== 10. TEST EDGE CASES =====
    test("trims whitespace from email and password before API call", async () => {
        const { loginAPI } = require("../services/axios.services");
        loginAPI.mockResolvedValueOnce({
            token: "token",
            role: "DRIVER",
        });

        renderUI();

        fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
            target: { value: "  test@example.com  " },
        });
        fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
            target: { value: "  123456  " },
        });
        submit();

        await waitFor(() => {
            expect(loginAPI).toHaveBeenCalledWith("test@example.com", "123456");
        });
    });
});
