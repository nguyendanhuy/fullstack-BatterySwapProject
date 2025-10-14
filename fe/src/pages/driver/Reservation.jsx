import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Zap, Star, Clock, Calendar as CalendarIcon, Bike } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Steps } from "antd";
import { UserOutlined, CalendarOutlined, ClockCircleOutlined, CreditCardOutlined, LoadingOutlined } from "@ant-design/icons";

const Reservation = () => {
  // lấy từ StationFinder
  const { selectBattery } = useLocation().state || {};

  // copy sang local state để có thể cập nhật trực tiếp date/time trong từng dòng
  const [sb, setSb] = useState(selectBattery || {});
  useEffect(() => {
    if (selectBattery) setSb(selectBattery);
  }, [selectBattery]);

  // chỉ lấy dòng có qty > 0
  const lines = useMemo(
    () => Object.values(sb || {}).filter((l) => Number(l?.qty || 0) > 0),
    [sb]
  );

  // xe đang được chọn
  const [activeId, setActiveId] = useState(null);
  // nếu chưa có xe nào được chọn, mặc định chọn xe đầu tiên
  useEffect(() => {
    if (!activeId && lines.length > 0) {
      setActiveId(lines[0].vehicleInfo?.vehicleId);
    }
  }, [lines, activeId]);

  // cập nhật date/time vào sb[vehicleId]
  const setDateTime = (vehicleId, { date, time }) => {
    setSb((prev) => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        date: date ?? prev[vehicleId]?.date,
        time: time ?? prev[vehicleId]?.time,
      },
    }));
  };

  // khung giờ
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ];

  // tổng số pin
  const totalBatteries = useMemo(
    () => lines.reduce((s, l) => s + Number(l?.qty || 0), 0),
    [lines]
  );

  // disable slot đã qua
  const isSlotDisabled = (vehicleId, time) => {
    const date = sb?.[vehicleId]?.date;
    if (!date) return true;
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (!sameDay) return false;
    const [h, m] = time.split(":").map(Number);
    const slot = new Date(date);
    slot.setHours(h, m, 0, 0);
    return slot <= now;
  };

  // các bước
  const isStationReady = lines.length > 0 && totalBatteries > 0;
  const anyDatePicked = lines.every((l) => !!sb[l.vehicleInfo.vehicleId]?.date);
  const anyTimePicked = lines.every((l) => {
    const v = sb[l.vehicleInfo.vehicleId];
    return !!v?.date && !!v?.time;
  });

  const currentStep = !isStationReady ? 0 : !anyDatePicked ? 1 : !anyTimePicked ? 2 : 3;
  const stepItems = [
    { title: "Chọn trạm & pin", icon: <UserOutlined /> },
    { title: "Chọn ngày", icon: <CalendarOutlined /> },
    { title: "Chọn khung giờ", icon: <ClockCircleOutlined /> },
    { title: "Thanh toán", icon: <CreditCardOutlined /> },
  ];
  const itemsWithStatus = stepItems.map((s, idx) => ({
    ...s,
    status: idx < currentStep ? "finish" : idx === currentStep ? "process" : "wait",
    icon: idx === currentStep ? <LoadingOutlined /> : s.icon,
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Đặt lịch</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Steps */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="px-6 py-4">
                <Steps current={currentStep} items={itemsWithStatus} />
              </div>
            </Card>

            {/* Danh sách pin */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Thông tin pin đã chọn
                </CardTitle>
              </CardHeader>

              {lines.length === 0 && (
                <CardContent>
                  <p className="text-sm text-gray-600">Chưa có trạm nào được chọn.</p>
                </CardContent>
              )}

              {lines.map((line) => {
                const st = line?.stationInfo || {};
                const qty = Number(line?.qty || 0);
                const type = line?.batteryType;
                const id = line?.vehicleInfo?.vehicleId;
                const isActive = id === activeId;

                return (
                  <CardContent key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(id)}
                      className={`w-full text-left transition-all duration-300 ${isActive ? "ring-4 ring-blue-500 rounded-2xl scale-[1.01]" : "hover:scale-[1.005]"
                        }`}
                    >
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{st?.stationName || "—"}</h3>
                        <div className="flex items-center space-x-2 text-gray-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{st?.address || "—"}</span>
                        </div>
                        {line?.vehicleInfo && (
                          <div className="mt-2 mb-3 flex items-center text-sm text-gray-700">
                            <Bike className="h-4 w-4 mr-2 text-gray-500" />
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span>Xe: <b>{line.vehicleInfo.vehicleType || "—"}</b></span>
                              {line.vehicleInfo.batteryType && (
                                <span>— Pin <b>{line.vehicleInfo.batteryType}</b></span>
                              )}
                              {typeof line.vehicleInfo.batteryCount !== "undefined" && (
                                <span>(cần {line.vehicleInfo.batteryCount || 1} pin)</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="pt-4 border-t border-blue-200">
                          <div className="p-4 bg-gradient-to-br from-white to-blue-50 rounded-lg border border-blue-100 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                  <Zap className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                  Pin {type || "—"}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  {qty}
                                </span>
                                <span className="text-sm text-gray-500">pin</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </CardContent>
                );
              })}
            </Card>

            {/* Chọn ngày */}
            {activeId && (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    Chọn ngày cho xe đang chọn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={sb[activeId]?.date}
                      onSelect={(date) => setDateTime(activeId, { date: date, time: "" })}
                      className="rounded-xl border shadow-sm bg-white"
                      locale={vi}
                      disabled={(date) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maxDate = new Date(today);
                        maxDate.setDate(today.getDate() + 14);
                        return d < today || d > maxDate;
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chọn khung giờ */}
            {activeId && (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg mr-3">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Chọn khung giờ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((time) => {
                      const disabled = isSlotDisabled(activeId, time);
                      const active = sb[activeId].time === time && !disabled;
                      return (
                        <Button
                          key={time}
                          disabled={disabled}
                          onClick={() => !disabled && setDateTime(activeId, { time })}
                          className={`h-12 text-sm font-medium transition-all duration-300
                          ${active
                              ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg hover:scale-105"
                              : "bg-white border-2 border-blue-400 text-blue-600 hover:border-blue-500 hover:text-blue-700"}
                          ${disabled ? "opacity-50 cursor-not-allowed hover:scale-100" : "hover:scale-105"}`}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT - Tổng kết */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm sticky top-6">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Thông tin đặt lịch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {lines.map((line) => {
                  const st = line?.stationInfo || {};
                  const qty = Number(line?.qty || 0);
                  const type = line?.batteryType;
                  const id = line?.vehicleInfo?.vehicleId;
                  const date = sb[id]?.date;
                  const time = sb[id]?.time;

                  return (
                    <div
                      key={`summary-${id}`}
                      className={`flex items-start space-x-4 p-4 rounded-xl ${date || time ? "bg-blue-50" : "bg-gray-50"}`}
                    >
                      <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                      <div className="w-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{st?.stationName || "—"}</p>
                            <p className="text-sm text-gray-600">{st?.address || "—"}</p>
                          </div>
                          <Button
                            variant="outline"
                            className="h-8 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600"
                            onClick={() => setActiveId(id)}
                          >
                            Chỉnh
                          </Button>
                        </div>

                        <div className="flex items-center mt-2 justify-between">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-yellow-600 ml-1">
                              {st?.rating ?? "Chưa có"} đánh giá
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Pin {type}:</span>{" "}
                            <b className="text-gray-800">{qty}</b>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2 p-2 rounded-lg bg-purple-50">
                            <CalendarIcon className="h-4 w-4 text-purple-600" />
                            <span>{date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chưa chọn ngày"}</span>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-lg bg-orange-50">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>{time || "Chưa chọn giờ"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Tổng cộng */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700">Phí đổi pin :</span>
                    <span className="font-semibold text-gray-800">25.000 VNĐ</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700">Tổng số pin:</span>
                    <span className="font-semibold text-gray-800">x{totalBatteries}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-blue-600">
                      {(totalBatteries * 25000).toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                </div>

                {/* Thanh toán */}
                <div className="space-y-3 pt-6">
                  <Link
                    to="/driver/payment"
                    className={`block ${!anyTimePicked ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                      <Zap className="h-5 w-5 mr-2" />
                      Tiến hành thanh toán
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    💡 Bạn có thể thanh toán toàn bộ hoặc đặt cọc để giữ chỗ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Reservation;
