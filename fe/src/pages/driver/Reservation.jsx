import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Battery, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
const Reservation = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedBatteryType, setSelectedBatteryType] = useState("");
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
            {/* Station Selection */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Chọn trạm đổi pin
                </CardTitle>
                <CardDescription className="text-gray-600">Chọn trạm phù hợp với vị trí của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedStation}>
                  <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Chọn trạm" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (<SelectItem key={station.id} value={station.id} className="py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{station.name}</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-yellow-600 ml-1">{station.rating}</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{station.address}</span>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-green-600 font-semibold">{station.available} pin có sẵn</span>
                          <Badge variant="secondary" className="text-xs">Sạc nhanh</Badge>
                        </div>
                      </div>
                    </SelectItem>))}
                  </SelectContent>
                </Select>
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
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-xl border shadow-sm bg-white" locale={vi} disabled={(date) => date < new Date()} />
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
                  {timeSlots.map((time) => (<Button key={time} variant={selectedTime === time ? "default" : "outline"} onClick={() => setSelectedTime(time)} className={`h-12 text-sm font-medium transition-all duration-300 hover:scale-105 ${selectedTime === time
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : 'border-2 border-gray-200 hover:border-orange-300'}`}>
                    <Clock className="h-4 w-4 mr-1" />
                    {time}
                  </Button>))}
                </div>
              </CardContent>
            </Card>

            {/* Battery Type Selection */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-slide-up">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Chọn loại pin
                </CardTitle>
                <CardDescription className="text-gray-600">Chọn loại pin phù hợp với xe của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStation ? (<div className="space-y-4">
                  {Object.entries(stations.find(s => s.id === selectedStation)?.batteryTypes || {}).map(([type, count]) => (count > 0 && (<div key={type} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedBatteryType === type
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedBatteryType(type)}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-gradient-to-r ${type === "Lithium-ion" ? "from-blue-500 to-indigo-500" : "from-green-500 to-emerald-500"} rounded-xl`}>
                        <Battery className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-800">
                          {type}
                          {type === "Lithium-ion" && " ⭐ Khuyến nghị"}
                        </p>
                        <p className="text-sm text-gray-600">{count} pin có sẵn</p>
                      </div>
                    </div>
                    {selectedBatteryType === type && (<div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    </div>)}
                  </div>)))}
                </div>) : (<div className="text-center py-8">
                  <Battery className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Vui lòng chọn trạm trước</p>
                </div>)}
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
                    <p className="font-semibold text-gray-800">{stations.find(s => s.id === selectedStation)?.name}</p>
                    <p className="text-sm text-gray-600">{stations.find(s => s.id === selectedStation)?.address}</p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-yellow-600 ml-1">{stations.find(s => s.id === selectedStation)?.rating} đánh giá</span>
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

                {selectedBatteryType && (<div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
                  <Battery className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Loại pin</p>
                    <p className="text-sm text-gray-600">{selectedBatteryType}</p>
                  </div>
                </div>)}

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700">Phí đổi pin:</span>
                    <span className="font-semibold text-gray-800">150,000 VNĐ</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-blue-600">150,000 VNĐ</span>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <Link to="/driver/payment" className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg" disabled={!selectedStation || !selectedDate || !selectedTime || !selectedBatteryType}>
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
