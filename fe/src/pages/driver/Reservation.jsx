import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Zap, Star, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Steps } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const Reservation = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");

  //  Lấy dữ liệu từ router state và ép về mảng
  const { station } = useLocation().state || {};
  const stations = station ? Object.values(station) : [];

  //  Các khung giờ có thể chọn
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ];

  //  Tính tổng số pin
  const totalBatteries = stations.reduce((sum, st) => {
    const count = Object.values(st?.batteries || {}).reduce(
      (a, b) => a + b
    );
    return sum + count;
  }, 0);

  //  Quản lý các bước (progress bar)
  const isStationReady = stations.length > 0 && totalBatteries > 0;
  const isDateReady = !!selectedDate;
  const isTimeReady = !!selectedTime;
  const currentStep = !isStationReady ? 0 : !isDateReady ? 1 : !isTimeReady ? 2 : 3;

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

  useEffect(() => {
    setSelectedTime(""); // reset khi đổi ngày
  }, [selectedDate]);

  //  Disable slot đã qua
  const isSlotDisabled = (time) => {
    if (!selectedDate) return true;
    const now = new Date();

    const sameDay =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    if (!sameDay) return false;

    const [h, m] = time.split(":").map(Number);
    const slot = new Date(selectedDate);
    slot.setHours(h, m, 0, 0);
    return slot <= now;
  };

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
          {/* ========== CỘT TRÁI ========== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="px-6 py-4">
                <Steps current={currentStep} items={itemsWithStatus} />
              </div>
            </Card>

            {/* Station Info */}
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

              {stations.length === 0 && (
                <CardContent>
                  <p className="text-sm text-gray-600">Chưa có trạm nào được chọn.</p>
                </CardContent>
              )}

              {stations.map((st) => (
                <CardContent key={st?.stationInfo?.stationId}>
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {st?.stationInfo?.stationName}
                    </h3>

                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{st?.stationInfo?.address}</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-600 ml-1">
                          {st?.stationInfo?.rating ?? "Chưa có"} đánh giá
                        </span>
                      </div>
                    </div>

                    {Object.entries(st?.batteries || {}).map(([type, qty]) => (
                      <div key={type} className="pt-4 border-t border-blue-200">
                        <div className="p-4 bg-gradient-to-br from-white to-blue-50 rounded-lg border border-blue-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <Zap className="h-4 w-4 text-white" />
                              </div>
                              <p className="text-sm font-medium text-gray-700">Pin {type}</p>
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
                    ))}
                  </div>
                </CardContent>
              ))}
            </Card>

            {/* Date Selection */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  Chọn ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-xl border shadow-sm bg-white"
                    locale={vi}
                    disabled={(date) => {
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const maxDate = new Date(today);
                      maxDate.setDate(today.getDate() + 2);
                      return d < today || d > maxDate;
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
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
                    const disabled = isSlotDisabled(time);
                    const active = selectedTime === time && !disabled;
                    return (
                      <Button
                        key={time}
                        disabled={disabled}
                        onClick={() => !disabled && setSelectedTime(time)}
                        className={`h-12 text-sm font-medium transition-all duration-300
                          ${active
                            ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg hover:scale-105"
                            : "border-2 border-gray-200 hover:border-orange-300"}
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
          </div>

          {/* ========== CỘT PHẢI ========== */}
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
                {stations.map((st) => (
                  <div
                    key={`summary-${st?.stationInfo?.stationId}`}
                    className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl"
                  >
                    <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {st?.stationInfo?.stationName}
                      </p>
                      <p className="text-sm text-gray-600">{st?.stationInfo?.address}</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-yellow-600 ml-1">
                          {st?.stationInfo?.rating ?? "Chưa có"} đánh giá
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedDate && (
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Ngày đặt lịch</p>
                      <p className="text-sm text-gray-600">
                        {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Khung giờ</p>
                      <p className="text-sm text-gray-600">{selectedTime}</p>
                    </div>
                  </div>
                )}

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

                <div className="space-y-3 pt-6">
                  <Link
                    to="/driver/payment"
                    className={`block ${!isStationReady || !selectedDate || !selectedTime
                      ? "pointer-events-none opacity-50"
                      : ""
                      }`}
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
    </div>
  );
};

export default Reservation;
