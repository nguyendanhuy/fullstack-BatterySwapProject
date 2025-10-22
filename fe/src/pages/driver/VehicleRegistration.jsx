import { useEffect, useState, useContext } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car, Battery, CheckCircle, Star, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getVehicleInfoByVin, registerVehicleByVin } from "@/services/axios.services";
import { deactivateVehicleByVin, getUserAllVehicles } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";

// Dialog xác nhận xóa đăng ký xe
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function VehicleRegistration() {
  const { userData, userVehicles, setUserVehicles } = useContext(SystemContext);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vin: "",
    ownername: "",
    vehicleType: "",
    batteryType: "",
    batteryCount: "",
    purchaseDate: "",
    manufactureYear: "",
    color: "",
    licensePlate: "",
    userId: "",
  });

  const [checkingVin, setCheckingVin] = useState(false);
  const [lastQueriedVin, setLastQueriedVin] = useState("");
  const [isAlreadyActive, setIsAlreadyActive] = useState(false); // BE active: true
  const [canRegister, setCanRegister] = useState(false); // chỉ true khi tra cứu VIN OK

  const [registeredVehicles, setRegisteredVehicles] = useState([]);

  useEffect(() => {
    // userVehicles được fetch tự động bởi AuthProvider khi có token
    // Chỉ cần đồng bộ vào state local
    if (userVehicles && Array.isArray(userVehicles)) {
      setRegisteredVehicles(userVehicles);
    } else {
      setRegisteredVehicles([]);
    }
  }, [userVehicles]);

  // Kiểm tra VIN hợp lệ (17 ký tự, không chứa I, O, Q)
  const isValidVin = (vin) => /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);

  const pickApiMessage = (res) =>
    res?.messages?.auth ||
    res?.messages?.business ||
    res?.error ||
    'Vui lòng kiểm tra lại.';

  const isErrorResponse = (res) =>
    (typeof res?.status === 'number' && res?.status >= 400) ||
    !!res?.error ||
    !!res?.messages?.auth ||
    !!res?.messages?.business;

  const lookupVin = async (vin) => {
    try {
      setCheckingVin(true);
      const res = await getVehicleInfoByVin(vin);

      console.log("Vin Information :", vin, res);

      if (isErrorResponse(res)) {
        setFormData((prev) => ({
          ...prev,
          ownername: "",
          vehicleType: "",
          batteryType: "",
          batteryCount: "",
          purchaseDate: "",
          manufactureYear: "",
          color: "",
          licensePlate: "",
          userId: "",
        }));
        setIsAlreadyActive(false);
        setCanRegister(false);
        setLastQueriedVin("");
        toast({ title: "Tra cứu VIN thất bại", description: pickApiMessage(res), variant: "destructive" });
        return;
      }

      // Thành công
      const activeFlag = (res?.active !== false) || (res?.userId != null);


      setFormData((prev) => ({
        ...prev,
        vehicleType: res?.vehicleType,
        batteryType: res?.batteryType,
        batteryCount: res?.batteryCount,
        color: res?.color,
        manufactureYear: res?.manufactureYear,
        purchaseDate: res?.purchaseDate,
        licensePlate: res?.licensePlate,
        ownername: res?.ownerName ?? res?.ownername,
        userId: res?.userId,
      }));
      setIsAlreadyActive(activeFlag);
      setLastQueriedVin(vin);

      if (activeFlag) {
        setCanRegister(false);
        toast({
          title: "Cảnh báo",
          description:
            "⚠️ Xe này đã được đăng ký " +
            (userData?.userId == res?.userId ? "bởi chính bạn" : "bởi tài khoản khác") +
            ".",
          variant: "destructive",
        });
      } else {
        setCanRegister(true);
        toast({
          title: "Tra cứu VIN thành công!",
          description: "Đã tự nhận dòng xe và loại pin!",
          className: "bg-green-500 text-white",
        });
      }
    } catch (err) {
      setCanRegister(false);
      toast({
        title: "Tra cứu VIN thất bại (có thể do mạng)",
        description: "Không thể kết nối đến server. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setCheckingVin(false);
    }
  };

  // Đăng ký xe
  const handleRegisterVehicle = async () => {
    const { vin } = formData;

    if (!vin || !isValidVin(vin)) {
      toast({
        title: "Thiếu/không hợp lệ VIN",
        description: "Vui lòng nhập VIN đủ 17 ký tự.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await registerVehicleByVin(vin);


      if (isErrorResponse(res)) {
        toast({ title: "Đăng ký xe thất bại", description: pickApiMessage(res), variant: "destructive" });
        return;
      }

      toast({
        title: "Đăng ký xe thành công!",
        description: res?.messages?.success || res?.message || "Xe đã được đăng ký vào hệ thống.",
        className: "bg-green-500 text-white",
      });

      // ✅ Reload lại danh sách xe và cập nhật context
      try {
        const updatedVehicles = await getUserAllVehicles();

        if (isErrorResponse(updatedVehicles)) {
          toast({ title: "Đăng ký xe thất bại", description: pickApiMessage(updatedVehicles), variant: "destructive" });
          return;
        }

        if (updatedVehicles && Array.isArray(updatedVehicles)) {
          setUserVehicles(updatedVehicles);
        }
      } catch (err) {
        console.error("Lỗi khi reload danh sách xe:", err);
      }

      if (res?.active === true) setIsAlreadyActive(true);

      setFormData({
        vin: "",
        ownername: "",
        vehicleType: "",
        batteryType: "",
        batteryCount: "",
        purchaseDate: "",
        manufactureYear: "",
        color: "",
        licensePlate: "",
        userId: "",
      });
      setLastQueriedVin("");
      setCanRegister(false);
    } catch (err) {
      toast({ title: "Đăng ký xe thất bại", description: err?.message || "Vui lòng thử lại sau", variant: "destructive" });
    }
  };

  const handleUnregisterVehicle = async (vehicleID) => {
    try {
      const res = await deactivateVehicleByVin(vehicleID);


      if (isErrorResponse(res)) {
        toast({ title: "Xóa xe thất bại", description: pickApiMessage(res), variant: "destructive" });
        return;
      }

      toast({
        title: "Hủy đăng ký xe thành công!",
        description: res?.messages?.success || res?.message || "Xe đã được hủy đăng ký.",
        className: "bg-green-500 text-white",
      });

      // ✅ Reload lại danh sách xe và cập nhật context
      try {
        const updatedVehicles = await getUserAllVehicles();
        if (isErrorResponse(updatedVehicles)) {
          toast({ title: "Đăng ký xe thất bại", description: pickApiMessage(updatedVehicles), variant: "destructive" });
          return;
        }

        if (updatedVehicles && Array.isArray(updatedVehicles)) {
          setUserVehicles(updatedVehicles);
        }
      } catch (err) {
        console.error("Lỗi khi reload danh sách xe:", err);
      }
    } catch (err) {
      toast({ title: "Xóa xe thất bại", description: err?.message || "Vui lòng thử lại sau", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">Đăng ký xe</h1>
        </div>
      </header>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start lg:items-stretch">
          {/* Left: Registration Form */}
          <div>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
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

              <CardContent className="space-y-6 flex-1 overflow-y-auto min-h-0 pr-2">
                {/* VIN */}
                <div className="space-y-3">
                  <Label htmlFor="vin" className="text-sm font-semibold text-gray-700">
                    Mã VIN
                  </Label>
                  <Input
                    id="vin"
                    placeholder="Nhập mã VIN của xe (17 ký tự gồm cả chữ và số trừ O, I, Q)"
                    value={formData.vin}
                    onChange={(e) => {
                      const nextVin = e.target.value.trim();
                      setFormData({ ...formData, vin: nextVin });
                      if (nextVin.length === 17 && lastQueriedVin !== nextVin) {
                        lookupVin(nextVin);
                      } else if (nextVin.length < 17 && lastQueriedVin) {
                        setLastQueriedVin("");
                        // VIN không đủ nữa => clear các field phụ thuộc VIN
                        setFormData((prev) => ({
                          ...prev,
                          ownername: "",
                          vehicleType: "",
                          batteryType: "",
                          batteryCount: "",
                          purchaseDate: "",
                          manufactureYear: "",
                          color: "",
                          licensePlate: "",
                          userId: "",
                        }));
                        setIsAlreadyActive(false);
                        setCanRegister(false);
                      }
                    }}
                    maxLength={17}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                  {checkingVin && (
                    <div className="text-xs text-gray-500">Đang kiểm tra VIN…</div>
                  )}
                </div>

                {/* Vehicle fields (read-only) */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Dòng xe VINFAST (Nhận tự động)</Label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input value={formData.vehicleType || "—"} readOnly className="h-12 bg-gray-100 border-gray-200 text-gray-800 rounded-xl pl-9" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Loại pin (Nhận tự động)</Label>
                  <div className="relative">
                    <Battery className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input value={formData.batteryType || "—"} readOnly className="h-12 bg-gray-100 border-gray-200 text-gray-800 rounded-xl pl-9" />
                  </div>
                </div>

                {isAlreadyActive && (
                  <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    ⚠️ Xe này đã được đăng ký {userData?.userId == formData?.userId ? "bởi chính bạn" : "bởi tài khoản khác"}.
                  </div>
                )}

                {registeredVehicles.length >= 3 && (
                  <div className="text-sm font-semibold text-orange-600 flex items-center gap-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                    🚫 Bạn đã đạt giới hạn tối đa 3 xe. Vui lòng hủy đăng ký xe cũ để thêm xe mới.
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={!canRegister || registeredVehicles.length >= 3}
                        title={
                          registeredVehicles.length >= 3
                            ? "Bạn đã đạt giới hạn tối đa 3 xe. Vui lòng hủy đăng ký xe cũ để thêm xe mới."
                            : !canRegister
                              ? "Vui lòng nhập VIN hợp lệ và chờ hệ thống xác nhận xe có thể đăng ký"
                              : "Đăng ký xe vào hệ thống"
                        }
                        className="flex-1 w-full rounded-xl py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {registeredVehicles.length >= 3 ? "Đã đạt giới hạn (3/3)" : "Đăng ký xe"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận đăng ký xe</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc chắn muốn đăng ký xe này không?</AlertDialogDescription>
                      </AlertDialogHeader>

                      {/* Chi tiết xe từ formData */}
                      <div className="px-6 pb-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Chi tiết xe</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">VIN</div>
                            <div className="font-medium text-gray-900 break-all">{formData.vin || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Chủ xe</div>
                            <div className="font-medium text-gray-900">{formData.ownername || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Dòng xe</div>
                            <div className="font-medium text-gray-900">{formData.vehicleType || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Loại pin</div>
                            <div className="font-medium text-gray-900">{formData.batteryType || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Số lượng pin</div>
                            <div className="font-medium text-gray-900">{formData.batteryCount || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Năm sản xuất</div>
                            <div className="font-medium text-gray-900">{formData.manufactureYear || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Ngày mua</div>
                            <div className="font-medium text-gray-900">{formData.purchaseDate || "—"}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Màu</div>
                            <div className="font-medium text-gray-900">{formData.color || "—"}</div>
                          </div>

                          <div className="sm:col-span-2 bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">Biển số</div>
                            <div className="font-medium text-gray-900">{formData.licensePlate || "—"}</div>
                          </div>
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Không</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegisterVehicle}>Có</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Link to="/driver" className="flex-1">
                    <Button className="flex-1 w-full rounded-xl py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                      Hủy bỏ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Right: registered vehicles (scrollable) + benefits */}
          <div className="space-y-6 flex flex-col min-h-0">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in flex flex-col min-h-0 lg:h-[50vh]">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                <CardTitle className="flex items-center justify-between text-gray-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    Xe đã đăng ký
                  </div>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {registeredVehicles?.length || 0}/3
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto min-h-0 pr-2" >
                <div className="space-y-4">
                  {registeredVehicles.length > 0 ? (
                    registeredVehicles.map((item) => (
                      <div
                        key={item.vin}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                            <Car className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.vehicleType}</h3>
                            <p className="text-sm text-gray-600">VIN: {item.vin}</p>
                            <p className="text-sm text-gray-600">Pin: {item.batteryType}</p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="relative group px-4 py-2 font-medium rounded-lg bg-white/60 backdrop-blur hover:bg-white shadow-sm border border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:shadow-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                            >
                              <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-400/10 to-green-500/10" />
                              <Eye className="h-4 w-4 mr-1.5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                              <span>Chi tiết</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Chi tiết xe {item.vehicleType}</AlertDialogTitle>
                              <AlertDialogDescription>Thông tin và hành động dành cho xe này.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1 mb-4">
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">VIN</div><div className="font-medium text-gray-900">{item.vin || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Chủ xe</div><div className="font-medium text-gray-900">{item.ownername || item.ownerName || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Dòng xe</div><div className="font-medium text-gray-900">{item.vehicleType || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Loại pin</div><div className="font-medium text-gray-900">{item.batteryType || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Số lượng pin</div><div className="font-medium text-gray-900">{item.batteryCount ?? '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Ngày sản xuất</div><div className="font-medium text-gray-900">{item.manufactureDate || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Ngày mua</div><div className="font-medium text-gray-900">{item.purchaseDate || '—'}</div></div>
                              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Màu</div><div className="font-medium text-gray-900">{item.color || '—'}</div></div>
                              <div className="sm:col-span-2 bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Biển số</div><div className="font-medium text-gray-900">{item.licensePlate || '—'}</div></div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Đóng</AlertDialogCancel>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">Hủy đăng ký</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận hủy đăng ký</AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <p>
                                    Bạn có chắc chắn muốn hủy đăng ký xe này không? <br />
                                    Hành động này sẽ ngắt liên kết xe khỏi tài khoản của bạn.
                                  </p>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Không</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleUnregisterVehicle(item.vehicleId)}>
                                      Có
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 select-none">
                      <Car className="h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">Bạn chưa đăng ký xe nào</p>
                      <p className="text-xs text-gray-400">Hãy nhập VIN và bấm "Đăng ký xe" để bắt đầu.</p>
                      <p className="text-xs text-blue-600 font-medium">Giới hạn: Tối đa 3 xe</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Lợi ích */}
            <Card className="border-0 shadow-xl bg-green-50 animate-slide-up">
              <CardHeader className="sticky top-0 z-10 backdrop-blur-sm">
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
                  // "Hỗ trợ 24/7 từ đội ngũ kỹ thuật",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
