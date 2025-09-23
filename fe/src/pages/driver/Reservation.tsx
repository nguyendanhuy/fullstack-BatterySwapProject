import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Battery } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const Reservation = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
      batteryTypes: {
        "Lithium-ion": 8,
        "Pin LFP": 4,
        "Ắc quy chì": 0
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Đặt lịch giữ pin</h1>
          </div>
          <Link to="/driver/find-stations">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Chọn trạm</CardTitle>
                <CardDescription>Chọn trạm đổi pin phù hợp</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạm" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        <div className="flex flex-col">
                          <span>{station.name}</span>
                          <span className="text-sm text-muted-foreground">{station.address} - {station.available} pin có sẵn</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Chọn ngày</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border pointer-events-auto"
                  locale={vi}
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle>Chọn giờ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className="text-sm"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Chọn loại pin</CardTitle>
                <CardDescription>Chọn loại pin phù hợp với xe của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStation && (
                  <div className="space-y-3">
                    {Object.entries(stations.find(s => s.id === selectedStation)?.batteryTypes || {}).map(([type, count]) => (
                      count > 0 && (
                        <div
                          key={type}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedBatteryType === type ? 'border-electric-blue bg-electric-blue/5' : 'hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedBatteryType(type)}
                        >
                          <div className="flex items-center">
                            <Battery className="h-5 w-5 text-electric-blue mr-2" />
                            <div>
                              <p className={`font-medium ${type === "Lithium-ion" ? "text-electric-blue" : ""}`}>
                                {type}
                                {type === "Lithium-ion" && " (Khuyến nghị)"}
                              </p>
                              <p className="text-sm text-muted-foreground">{count} pin có sẵn</p>
                            </div>
                          </div>
                          {selectedBatteryType === type && (
                            <div className="w-4 h-4 rounded-full bg-electric-blue flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                )}
                {!selectedStation && (
                  <p className="text-muted-foreground text-center py-4">Vui lòng chọn trạm trước</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="animate-fade-in sticky top-6">
              <CardHeader>
                <CardTitle>Thông tin đặt lịch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedStation && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-electric-blue mt-0.5" />
                    <div>
                      <p className="font-medium">{stations.find(s => s.id === selectedStation)?.name}</p>
                      <p className="text-sm text-muted-foreground">{stations.find(s => s.id === selectedStation)?.address}</p>
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-electric-blue" />
                    <p>{format(selectedDate, "dd/MM/yyyy", { locale: vi })}</p>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-electric-blue" />
                    <p>{selectedTime}</p>
                  </div>
                )}

                {selectedBatteryType && (
                  <div className="flex items-center space-x-3">
                    <Battery className="h-5 w-5 text-electric-blue" />
                    <p>{selectedBatteryType}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Phí đổi pin:</span>
                    <span className="font-medium">150,000 VNĐ</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-electric-blue">150,000 VNĐ</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Link to="/driver/payment" className="block">
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={!selectedStation || !selectedDate || !selectedTime || !selectedBatteryType}
                    >
                      Tiến hành thanh toán
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Bạn có thể thanh toán toàn bộ hoặc đặt cọc để giữ chỗ
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