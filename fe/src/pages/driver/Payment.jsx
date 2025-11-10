import { useState, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Home, Zap, Shield, CheckCircle, Wallet } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { createBookingForVehicles } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";


const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(SystemContext);
  const { reservationData, totalPrice } = location.state || {};
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("WALLET"); // "VNPAY" or "WALLET"

  const items = Object.values(reservationData || {});
  const groupedByStation = items.reduce((acc, item) => {
    const stationId = item.stationInfo?.stationId;
    if (!acc[stationId]) acc[stationId] = [];
    acc[stationId].push(item);
    return acc;
  }, {});
  const stations = Object.values(groupedByStation);

  // Helpers
  const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
  const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);

  // Format booking data theo format mới
  const formatBookingData = () => {
    return {
      userId: userData?.userId,
      paymentMethod: paymentMethod,
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

  const handlePayment = async () => {
    if (!userData?.userId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người dùng",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Tạo booking mới
      const bookingData = formatBookingData();
      console.log("📤 Creating bookings:", bookingData);

      // Tạo booking (API sẽ tự tạo invoice)
      const response = await createBookingForVehicles(bookingData);
      console.log("✅ Booking response:", response);

      // Check error
      if (isErrorResponse(response)) {
        toast({
          title: "Đặt lịch thất bại!",
          description: pickApiMessage(response),
          variant: "destructive",
        });
        return;
      }

      if (paymentMethod === "WALLET") {
        sessionStorage.removeItem('battery-booking-selection');
        toast({
          title: "Đặt lịch thành công!",
          description: "Booking đã được thanh toán bằng ví hệ thống.",
          className: "bg-green-500 text-white",
        });

        navigate("/driver/booking-history");
        setUserData(prev => ({ ...prev, walletBalance: prev.walletBalance - totalPrice }));
        return;
      }

    } catch (error) {
      console.error("❌ Payment error:", error);
      toast({
        title: "Đặt lịch thất bại!",
        description: error?.message || "Có lỗi xảy ra khi đặt lịch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Loading Overlay */}
      {isProcessing && (
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
                <h3 className="text-xl font-bold text-gray-800">Đang xử lý...</h3>
                <p className="text-sm text-gray-600">Vui lòng đợi trong giây lát</p>
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
                  {/* Wallet Option */}
                  <button
                    onClick={() => setPaymentMethod("WALLET")}
                    className={`w-full flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all ${paymentMethod === "WALLET"
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                  >
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <Label className="text-lg font-semibold text-gray-800 cursor-pointer">
                        Ví hệ thống
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">Thanh toán nhanh bằng số dư ví</p>
                      {userData?.walletBalance.toLocaleString() && (
                        <p className="text-sm text-gray-600 mt-1">Số dư: <b>{userData.walletBalance.toLocaleString()}</b> VNĐ</p>
                      )}
                    </div>
                    {paymentMethod === "WALLET" && <CheckCircle className="h-6 w-6 text-green-500" />}
                  </button>
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
                    className="w-full rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    {isProcessing ? "Đang xử lý..." : "Thanh toán bằng Ví"}
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
      </div>
    </div>
  );
};

export default Payment;
