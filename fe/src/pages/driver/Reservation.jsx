import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Battery, Zap, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { se, vi } from "date-fns/locale";
const Reservation = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedBatteryType, setSelectedBatteryType] = useState("");
  const { station, selectedBatteries } = useLocation().state || {};
  const [selectedStation] = useState("1"); // Default selected station
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];
  const stations = [
    {
      id: "1",
      name: "Trạm Quận 1",
      address: "123 Nguyễn Huệ",
      available: 8,
      rating: 4.9,
      batteryTypes: {
        "Lithium-ion": 5,
        "Pin LFP": 3,
        "Ắc quy chì": 0
      }
    },
    {
      id: "2",
      name: "Trạm Quận 3",
      address: "456 Lê Văn Sỹ",
      available: 5,
      rating: 4.7,
      batteryTypes: {
        "Lithium-ion": 3,
        "Pin LFP": 2,
        "Ắc quy chì": 0
      }
    },
    {
      id: "3",
      name: "Trạm Bình Thạnh",
      address: "789 Xô Viết Nghệ Tĩnh",
      available: 12,
      rating: 4.8,
      batteryTypes: {
        "Lithium-ion": 8,
        "Pin LFP": 4,
        "Ắc quy chì": 0
      }
    }
  ];
  //Hàm check xem thời gian chọn có hợp lệ hay không
  const isSlotDisabled = (time) => {
    if (!selectedDate) return true;
    const now = new Date();

    // Nếu không phải hôm nay → cho chọn tất cả
    const sameDay =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    if (!sameDay) return false;

    // Nếu là hôm nay → disable giờ đã qua
    const [h, m] = time.split(":").map(Number);
    const slot = new Date(selectedDate);
    slot.setHours(h, m, 0, 0);
    return slot <= now;
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Đặt lịch</h1>
        </div>
      </header>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Station Info */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Thông tin pin đã chọn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {station.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{station.address}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-600 ml-1">
                              {station.rating} đánh giá
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Phần pin đã chọn */}
                    {Object.entries(selectedBatteries || {}).map(([type, qty]) => (
                      <div className="pt-4 border-t border-blue-200">
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
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-slide-up">
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
                  <Calendar mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-xl border shadow-sm bg-white"
                    locale={vi}
                    disabled={(date) => {
                      const today = new Date();
                      const maxDate = new Date();
                      maxDate.setDate(today.getDate() + 2); // Giới hạn 2 ngày tới
                      return date < today || date > maxDate; // Disable ngày nhỏ hơn hôm nay hoặc lớn hơn 2 ngày tới
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in">
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
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in sticky top-6">
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
                {selectedStation && (<div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800">{station.name}</p>
                    <p className="text-sm text-gray-600">{station.address}</p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-yellow-600 ml-1">{station.rating} đánh giá</span>
                    </div>
                  </div>
                </div>)}
                {selectedDate && (<div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Ngày đặt lịch</p>
                    <p className="text-sm text-gray-600">{format(selectedDate, "dd/MM/yyyy", { locale: vi })}</p>
                  </div>
                </div>)}

                {selectedTime && (<div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Khung giờ</p>
                    <p className="text-sm text-gray-600">{selectedTime}</p>
                  </div>
                </div>)}

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700">Phí đổi pin x10 :</span>
                    <span className="font-semibold text-gray-800">150,000 VNĐ</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-blue-600">150,000 VNĐ</span>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <Link to="/driver/payment" className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg" disabled={!selectedStation || !selectedDate || !selectedTime}>
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
    </div>);
};
export default Reservation;
