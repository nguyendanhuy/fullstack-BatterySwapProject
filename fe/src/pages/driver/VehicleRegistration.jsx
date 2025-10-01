import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car, ArrowLeft, Battery, Zap, CheckCircle, Star, Home, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getVehicleInfoByVin, registerVehicleByVin } from "@/services/axios.services";

export default function VehicleRegistration() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vin: "",
    vehicleType: "",
    batteryType: ""
  });

  const [checkingVin, setCheckingVin] = useState(false);
  const [lastQueriedVin, setLastQueriedVin] = useState("");
  const [isAlreadyActive, setIsAlreadyActive] = useState(false); // BE active: true

  // Helper ưu tiên lấy thông điệp lỗi đúng ý từ payload/status
  const pickApiMessage = (p, status, fallback) =>
    p?.messages?.auth ??
    p?.messages?.business ??
    p?.messages?.vin ??
    p?.message ??
    p?.error ??
    (typeof status === "number" ? `Lỗi ${status}` : fallback ?? "Đã xảy ra lỗi");

  // Tra cứu VIN khi đủ 17 ký tự
  const lookupVin = async (vin) => {
    try {
      setCheckingVin(true);
      const res = await getVehicleInfoByVin(vin);
      const payload = res?.data ?? res;               // chịu mọi kiểu interceptor
      const httpStatus = res?.status ?? payload?.status;

      // Xác định request lỗi
      const isError =
        (typeof httpStatus === "number" && httpStatus >= 400) ||
        !!payload?.error ||
        !!payload?.messages?.auth ||
        !!payload?.messages?.business ||
        !!payload?.messages?.vin;

      console.log("[VIN lookup payload]", payload);

      if (isError) {
        const msg = pickApiMessage(payload, httpStatus);
        // Không fill UI khi lỗi
        setFormData((prev) => ({ ...prev, vehicleType: "", batteryType: "" }));
        setIsAlreadyActive(false);
        setLastQueriedVin("");
        toast({ title: "Tra cứu VIN thất bại", description: msg, variant: "destructive" });
        return;
      }

      // Thành công
      const vehicleType = payload?.vehicleType ?? payload?.model ?? "";
      const batteryType = payload?.batteryType ?? payload?.battery ?? "";
      const activeFlag = !!payload?.active;

      setFormData((prev) => ({ ...prev, vehicleType, batteryType }));
      setIsAlreadyActive(activeFlag);
      setLastQueriedVin(vin);

      if (activeFlag) {
        toast({
          title: "Cảnh báo",
          description: "⚠️ Xe này đã được đăng ký.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Đã tra cứu VIN",
          description: "Đã tự nhận dòng xe và loại pin từ BE.",
        });
      }
    } catch (err) {
      const d = err?.response?.data;
      const msg = pickApiMessage(d, err?.response?.status, err?.message);
      toast({ title: "Tra cứu VIN thất bại", description: msg, variant: "destructive" });
      setFormData((p) => ({ ...p, vehicleType: "", batteryType: "" }));
      setIsAlreadyActive(false);
      setLastQueriedVin("");
    } finally {
      setCheckingVin(false);
    }
  };

  // Đăng ký xe: VIN + token
  const handleRegisterVehicle = async () => {
    const { vin } = formData;

    if (!vin || vin.length !== 17) {
      toast({
        title: "Thiếu/không hợp lệ VIN",
        description: "Vui lòng nhập VIN đủ 17 ký tự.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Thiếu token",
        description: "Chưa có token đăng nhập. Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }

    if (isAlreadyActive) {
      toast({
        title: "Không thể đăng ký",
        description: "⚠️ Xe này đã được đăng ký.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await registerVehicleByVin(vin, token);
      const payload = res?.data ?? res;
      const httpStatus = res?.status ?? payload?.status;

      const isError =
        (typeof httpStatus === "number" && httpStatus >= 400) ||
        !!payload?.error ||
        !!payload?.messages?.auth ||
        !!payload?.messages?.business ||
        !!payload?.messages?.vin;

      if (isError) {
        const msg = pickApiMessage(payload, httpStatus);
        toast({ title: "Đăng ký xe thất bại", description: msg, variant: "destructive" });
        return;
      }

      // Thành công
      toast({
        title: "Đăng ký xe thành công!",
        description: payload?.messages?.success || payload?.message || "Xe đã được đăng ký vào hệ thống.",
      });

      // Nếu BE trả active=true sau khi đăng ký, set lại flag
      if (payload?.active === true) setIsAlreadyActive(true);

      // (Tuỳ bạn) reset form
      // setFormData({ vin: "", vehicleType: "", batteryType: "" });
      // setIsAlreadyActive(false);
      // setLastQueriedVin("");
    } catch (err) {
      console.log(err);
      const d = err?.response?.data;
      const msg = pickApiMessage(d, err?.response?.status, err?.message);
      toast({ title: "Đăng ký xe thất bại", description: msg, variant: "destructive" });
    }
  };

  const handleUnregisterVehicle = () => {
    toast({
      title: "Hủy đăng ký xe thành công!",
      description: "Xe đã được gỡ khỏi hệ thống.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div
            className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-20 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Car className="h-10 w-10 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Đăng ký xe điện</h1>
                <p className="text-white/90 text-lg">Liên kết xe VINFAST với hệ thống đổi pin</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link to="/driver">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  Thông tin xe VINFAST
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Đăng ký và liên kết xe điện VINFAST của bạn với hệ thống
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* VIN */}
                <div className="space-y-3">
                  <Label htmlFor="vin" className="text-sm font-semibold text-gray-700">
                    Mã VIN
                  </Label>
                  <Input
                    id="vin"
                    placeholder="Nhập mã VIN của xe"
                    value={formData.vin}
                    onChange={(e) => {
                      const nextVin = e.target.value.trim();
                      setFormData({ ...formData, vin: nextVin });
                      if (nextVin.length === 17 && lastQueriedVin !== nextVin) {
                        lookupVin(nextVin);
                      } else if (nextVin.length < 17 && lastQueriedVin) {
                        setLastQueriedVin("");
                        setFormData((prev) => ({ ...prev, vehicleType: "", batteryType: "" }));
                        setIsAlreadyActive(false);
                      }
                    }}
                    maxLength={17}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                  {checkingVin && (
                    <div className="text-xs text-gray-500">Đang kiểm tra VIN…</div>
                  )}
                </div>

                {/* Dòng xe (read-only, icon bên trong input) */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    Dòng xe VINFAST (tự nhận)
                  </Label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input
                      value={formData.vehicleType || "—"}
                      readOnly
                      className="h-12 bg-gray-100 border-gray-200 text-gray-800 rounded-xl pl-9"
                    />
                  </div>
                </div>

                {/* Loại pin (read-only, icon bên trong input) */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    Loại pin (tự nhận)
                  </Label>
                  <div className="relative">
                    <Battery className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input
                      value={formData.batteryType || "—"}
                      readOnly
                      className="h-12 bg-gray-100 border-gray-200 text-gray-800 rounded-xl pl-9"
                    />
                  </div>
                </div>

                {/* Cảnh báo nếu xe đã active */}
                {isAlreadyActive && (
                  <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    ⚠️ Xe này đã được đăng ký.
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={handleRegisterVehicle}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={
                      !formData.vin ||
                      formData.vin.length !== 17 ||
                      isAlreadyActive
                    }
                    title={
                      isAlreadyActive
                        ? "Xe này đã được đăng ký — không thể đăng ký lại"
                        : (formData.vin.length !== 17 ? "VIN phải đủ 17 ký tự" : "")
                    }
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Đăng ký xe
                  </Button>
                  <Link to="/driver" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Hủy bỏ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Star className="h-6 w-6 mr-2" />
                  Lợi ích khi đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Tìm trạm đổi pin nhanh chóng",
                  "Đặt lịch trước để tiết kiệm thời gian",
                  "Theo dõi lịch sử và chi phí",
                  "Hỗ trợ 24/7 từ đội ngũ kỹ thuật",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  Xe đã đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">VF 8 Plus</h3>
                        <p className="text-sm text-gray-600">VIN: VF1A12345678901234</p>
                        <p className="text-sm text-gray-600">Pin: Lithium-ion</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleUnregisterVehicle}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy đăng ký
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
