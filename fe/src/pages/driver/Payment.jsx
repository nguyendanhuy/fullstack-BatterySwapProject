import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Home, Zap, Shield, CheckCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { createBookingForVehicles, createInvoiceForBookings, createVNPayUrl, checkVNPayPaymentStatus } from "@/services/axios.services";


const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reservationData, totalPrice, pendingInvoice } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [count, setCount] = useState(0);

  const items = Object.values(reservationData || {});
  const groupedByStation = items.reduce((acc, item) => {
    const stationId = item.stationInfo?.stationId;
    if (!acc[stationId]) acc[stationId] = [];
    acc[stationId].push(item);
    return acc;
  }, {});
  const stations = Object.values(groupedByStation);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnpTxnRef = urlParams.get('vnp_TxnRef');

    if (vnpTxnRef) {
      handleVNPayReturn(vnpTxnRef);
    }
  }, []);

  const handleVNPayReturn = async (txnRef) => {
    let retryCount = 0; // ✅ Khởi tạo counter local

    const checkStatus = async () => {
      try {
        const paymentStatus = await checkVNPayPaymentStatus(txnRef);
        console.log("✅ VNPay payment status:", paymentStatus);

        // Nếu vẫn PENDING do get kết quả sớm hơn vnpay trả thì retry đợi vnpay
        if (retryCount < 5 && paymentStatus.paymentStatus === "PENDING") {
          console.log(`⏳ Payment still pending, retry ${retryCount + 1}/5...`);
          retryCount++;
          setTimeout(checkStatus, 3000);
          return;
        }


        if (paymentStatus.paymentStatus === "SUCCESS" || paymentStatus.vnpResponseCode === "00") {
          sessionStorage.removeItem('battery-booking-selection');
          toast({
            title: "Thanh toán thành công!",
            description: paymentStatus.message || "Giao dịch đã được xác nhận.",
            className: "bg-green-500 text-white",
            duration: 5000,
          });
          setTimeout(() => navigate("/driver"), 2000);

        } else {
          toast({
            title: "Thanh toán thất bại!",
            description: paymentStatus.message || "Vui lòng kiểm tra lại thông tin.",
            variant: "destructive",
            duration: 5000,
          });
          setTimeout(() => navigate("/driver"), 3000);
        }
      } catch (error) {
        console.error("❌ VNPay status check error:", error);
        // Retry nếu lỗi
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  };

  // Format data cho API
  const formatBookingData = () => {
    return {
      bookings: items.map((item, index) => ({
        vehicleId: parseInt(item.vehicleInfo?.vehicleId),
        stationId: item.stationInfo?.stationId,
        bookingDate: format(item.date, "yyyy-MM-dd"),
        timeSlot: item.time,
        batteryType: item.batteryType,
        batteryCount: item.qty,
        notes: `Xe ${index + 1} - Trạm ${item.stationInfo?.stationName}`
      }))
    };
  };

  const showError = (title, description, duration = 5000) => {
    setLoadingStep("");
    toast({ title, description, variant: "destructive", duration });
  };

  const redirectToVNPay = async (invoiceId) => {
    setLoadingStep("Đang tạo liên kết thanh toán...");
    const vnpayResponse = await createVNPayUrl({ invoiceId, bankCode: "VNPAY", orderType: "other" });
    console.log("✅ VNPay response:", vnpayResponse);

    if (vnpayResponse.error || vnpayResponse.status === 400 || !vnpayResponse.paymentUrl) {
      throw new Error(vnpayResponse.messages?.business || vnpayResponse.error || "Lỗi tạo thanh toán");
    }

    toast({
      title: "Chuyển đến trang thanh toán...",
      className: "bg-blue-500 text-white",
    });

    setTimeout(() => window.location.href = vnpayResponse.paymentUrl, 1000);
  };

  const handlePendingInvoicePayment = async () => {
    try {
      setIsProcessing(true);
      await redirectToVNPay(pendingInvoice.invoiceId);
    } catch (error) {
      showError("Tạo thanh toán thất bại!", error?.message || "Vui lòng liên hệ hỗ trợ");
    } finally {
      setIsProcessing(false);
      setLoadingStep("");
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setLoadingStep("Đang tạo booking...");

      const bookingData = formatBookingData();
      const response = await createBookingForVehicles(bookingData);
      console.log("✅ Booking response:", response);

      // Check lỗi từ booking API
      if (!response.success || !response.data) {
        return showError("Tạo booking thất bại!", response.message || "Có lỗi xảy ra", 10000);
      }

      // Check booking một phần thất bại
      if (!response.data.allSuccess) {
        const failedErrors = response.data.failedBookings
          ?.map(fb => `Xe ${fb.vehicleId}: ${fb.error}`)
          .join("\n") || "Có lỗi xảy ra";
        return showError(response.data.message || "Đặt lịch thất bại!", failedErrors, 10000);
      }

      // Tạo invoice và payment
      setLoadingStep("Đang tạo hóa đơn...");
      const bookingIds = response.data.successBookings.map(sb => sb.bookingId);
      const invoiceResponse = await createInvoiceForBookings(bookingIds);
      await redirectToVNPay(invoiceResponse.invoiceId);

    } catch (error) {
      showError("Đặt lịch thất bại!", error?.message || error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
      setLoadingStep("");
    }
  };

  const LoadingStep = ({ step, label, active }) => (
    <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${active ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50"}`}>
      <div className={`w-2 h-2 rounded-full ${active ? "bg-blue-600 animate-pulse" : "bg-gray-400"}`}></div>
      <span className={`text-sm font-medium ${active ? "text-blue-600" : "text-gray-500"}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Loading Overlay */}
      {isProcessing && loadingStep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">{loadingStep}</h3>
                <p className="text-sm text-gray-600">Quá trình này sẽ mất vài giây...</p>
              </div>
              <div className="w-full space-y-2">
                <LoadingStep step="booking" label="Tạo booking" active={loadingStep.includes("booking")} />
                <LoadingStep step="invoice" label="Tạo hóa đơn" active={loadingStep.includes("hóa đơn")} />
                <LoadingStep step="payment" label="Chuyển đến thanh toán" active={loadingStep.includes("liên kết") || loadingStep.includes("chuyển")} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Thanh toán</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Pending Invoice Payment Section */}
        {pendingInvoice ? (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-orange-500 shadow-xl bg-orange-50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-orange-800">
                  <CreditCard className="h-6 w-6 mr-3 text-orange-600" />
                  Hóa đơn chờ thanh toán
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Vui lòng hoàn tất thanh toán cho hóa đơn này
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-orange-200 space-y-3">
                  {[
                    { label: "Mã hóa đơn:", value: <Badge className="bg-orange-500 text-white">#{pendingInvoice.invoiceId}</Badge> },
                    { label: "Ngày tạo:", value: pendingInvoice.createdDate ? format(new Date(pendingInvoice.createdDate), "dd/MM/yyyy", { locale: vi }) : "N/A" },
                    { label: "Số lượng booking:", value: <Badge variant="outline">{pendingInvoice.bookings?.length || 0} lượt</Badge> }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-orange-200">
                    <span className="text-base font-semibold text-gray-800">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {pendingInvoice.totalAmount?.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                </div>

                {/* Chi tiết các booking */}
                {pendingInvoice.bookings && pendingInvoice.bookings.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <Badge variant="outline" className="mr-2">{pendingInvoice.bookings.length} lượt đặt lịch</Badge>
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {pendingInvoice.bookings.map((booking, idx) => (
                        <div key={idx} className="bg-orange-50 rounded-lg border border-orange-200 p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-800">
                                ID: {booking.vehicleId} - {booking.vehicleType}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                🏪 {booking.stationName}
                              </div>
                            </div>
                            <Badge className="bg-yellow-500 text-white text-xs">
                              {booking.bookingStatus}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <div>
                              📅 {format(new Date(booking.bookingDate), "dd/MM/yyyy", { locale: vi })}
                              <span className="mx-1">•</span>
                              ⏰ {booking.timeSlot}
                            </div>
                            <div className="font-semibold text-orange-600">
                              {booking.amount?.toLocaleString("vi-VN")} VNĐ
                            </div>
                          </div>
                          {booking.vehicleBatteryType && (
                            <div className="text-xs text-gray-500 mt-1">
                              🔋 {booking.vehicleBatteryType.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePendingInvoicePayment}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {isProcessing ? "Đang xử lý..." : "Thanh toán ngay"}
                </Button>

                <Link to="/driver" className="block">
                  <Button variant="outline" className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-3">
                    <Home className="h-5 w-5 mr-2" />
                    Về Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div className="space-y-6">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    Phương thức thanh toán
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Chọn phương thức thanh toán thuận tiện cho bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="flex items-center space-x-4 p-6 border-2 rounded-2xl border-blue-500 bg-blue-50 shadow-md"
                    >
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-lg font-semibold text-gray-800">
                          Thẻ tín dụng/ghi nợ
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">Visa, Mastercard, JCB</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="border-0 shadow-lg bg-white animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Shield className="h-6 w-6 mr-2" />
                    Bảo mật thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Mã hóa SSL 256-bit", "Tuân thủ chuẩn PCI DSS", "Không lưu trữ thông tin thẻ", "Xác thực 2 lớp"].map((f, i) => (
                    <div key={i} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-gray-700">{f}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Payment Details Card */}
            <div>
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in sticky top-6">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    Chi tiết thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hiển thị theo từng trạm */}
                  {stations.map((stationItems, idx) => (
                    <div key={idx}>
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-gray-600">Trạm {idx + 1}:</span>
                          <span className="font-semibold text-gray-800 text-right">
                            {stationItems[0]?.stationInfo?.stationName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Số lượng:</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {stationItems.reduce((s, i) => s + i.qty, 0)} pin
                          </Badge>
                        </div>
                      </div>

                      {stationItems.map((item, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2 mb-3">
                          <div className="flex justify-between">
                            <div className="text-sm">
                              <div className="font-semibold">{item.vehicleInfo?.vehicleType}</div>
                              <div className="text-gray-600">Pin {item.batteryType} × {item.qty}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            📅 {format(item.date, "dd/MM/yyyy", { locale: vi })} - ⏰ {item.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Phí dịch vụ:</span>
                      <span className="font-semibold">{totalPrice?.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold">
                      <span>Tổng thanh toán:</span>
                      <span className="text-blue-600">{totalPrice?.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      {isProcessing ? "Đang xử lý..." : "Tiếp tục với VNPay"}
                    </Button>

                    <Link to="/driver" className="block">
                      <Button variant="outline" className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105">
                        <Home className="h-5 w-5 mr-2" />
                        Về Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
