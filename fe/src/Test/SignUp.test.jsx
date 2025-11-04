import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";

// ----- Mocks -----
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate, Link: ({ children, to }) => <a href={to}>{children}</a> };
});

jest.mock("../services/axios.services", () => ({
  registerAPI: jest.fn(),
}));

// ---- Helpers ----
const fillAllValid = () => {
  fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: "Nguyen Van A" } });
  fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: "0123456789" } });
  fireEvent.change(screen.getByLabelText(/Địa chỉ/i), { target: { value: "123 ABC" } });
  fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), { target: { value: "123456" } });
  fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "123456" } });
  fireEvent.click(screen.getByLabelText(/Tôi đồng ý/i)); // agreeTerms
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: /Đăng ký/i }));

const renderUI = () =>
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );

describe("SignUp page (JSX)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();
    // mock window.open
    window.open = jest.fn();
  });

  test("render đầy đủ UI & xóa token khi mount", () => {
    localStorage.setItem("token", "abc");
    renderUI();
    expect(screen.getByText(/EV Battery Swap/i)).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("cập nhật state khi nhập input", () => {
    renderUI();
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: "A" } });
    expect(screen.getByDisplayValue("A")).toBeInTheDocument();
  });

  test("toggle hiện/ẩn mật khẩu khi bấm icon", () => {
    renderUI();
    const pwd = screen.getByLabelText(/^Mật khẩu$/i);
    expect(pwd).toHaveAttribute("type", "password");
    // nút icon là button ghost ở cùng dòng
    const toggles = screen.getAllByRole("button"); // có nhiều buttons, nhưng icon là cái cùng dòng với input
    fireEvent.click(toggles.find((b) => b.textContent === "")); // icon không có text
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toHaveAttribute("type", "text");
  });

  test("check/uncheck checkbox điều khoản", () => {
    renderUI();
    const cb = screen.getByLabelText(/Tôi đồng ý/i);
    expect(cb).not.toBeChecked();
    fireEvent.click(cb);
    expect(cb).toBeChecked();
  });

  // ---- Các nhánh lỗi bắt buộc để tăng branches coverage ----

  test("báo lỗi khi thiếu dữ liệu bắt buộc", async () => {
    renderUI();
    // bỏ trống fullName (và các required khác chưa fill)
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi họ tên sai định dạng (chứa số)", async () => {
    renderUI();
    fillAllValid();
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: "Nguyen Van 1" } });
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi email sai định dạng", async () => {
    renderUI();
    fillAllValid();
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: "invalid" } });
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Vui lòng nhập email hợp lệ",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi số điện thoại không đủ 10 số", async () => {
    renderUI();
    fillAllValid();
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: "123" } });
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Số điện thoại phải có đúng 10 chữ số",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi khi password confirm không khớp", async () => {
    renderUI();
    fillAllValid();
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "mismatch" } });
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Mật khẩu xác nhận không khớp",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi khi chưa đồng ý điều khoản", async () => {
    renderUI();
    fillAllValid();
    // uncheck lại
    fireEvent.click(screen.getByLabelText(/Tôi đồng ý/i));
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Bạn phải đồng ý với điều khoản sử dụng",
          variant: "destructive",
        })
      )
    );
  });

  test("báo lỗi khi mật khẩu < 6 ký tự", async () => {
    renderUI();
    fillAllValid();
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "123" } });
    submit();
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Mật khẩu phải có ít nhất 6 ký tự",
          variant: "destructive",
        })
      )
    );
  });

  // ---- Nhánh API ----
  test("API success -> toast success + navigate /login", async () => {
    const { registerAPI } = require("../services/axios.services");
    registerAPI.mockResolvedValueOnce({ status: 200, messages: {}, error: null });

    renderUI();
    fillAllValid();
    submit();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Đăng ký thành công!" })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("API trả lỗi business -> toast destructive, không chuyển trang", async () => {
    const { registerAPI } = require("../services/axios.services");
    registerAPI.mockResolvedValueOnce({
      status: 400,
      messages: { business: "Email đã tồn tại" },
    });

    renderUI();
    fillAllValid();
    submit();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đăng ký thất bại!",
          description: "Email đã tồn tại",
          variant: "destructive",
        })
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test("API throw exception -> toast thất bại chung", async () => {
    const { registerAPI } = require("../services/axios.services");
    registerAPI.mockRejectedValueOnce(new Error("network"));

    renderUI();
    fillAllValid();
    submit();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đăng ký thất bại!",
          description: "Có lỗi xảy ra, vui lòng thử lại",
          variant: "destructive",
        })
      );
    });
  });

  test("nút Đăng ký disabled khi isLoading (nhánh UI)", async () => {
    // ép isLoading bằng cách mock registerAPI treo 1 tick
    const { registerAPI } = require("../services/axios.services");
    let resolveFn;
    registerAPI.mockReturnValue(new Promise((res) => (resolveFn = res)));

    renderUI();
    fillAllValid();
    submit();

    const btn = screen.getByRole("button", { name: /Đang đăng ký/i });
    expect(btn).toBeDisabled();

    // xả promise
    resolveFn({ status: 200 });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
