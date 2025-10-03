
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, ArrowLeft, CheckCircle, User, Zap, Star, Smartphone, Box } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const QRCheckIn = () => {
  const { toast } = useToast();
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [batterySlotNumber, setBatterySlotNumber] = useState < number | null > (null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mockCustomer = {
    name: "Nguyễn Văn A",
    phone: "0123456789",
    vehicle: "VF 8 Plus",
    batteryType: "Lithium-ion",
    paymentStatus: "Đã thanh toán",
    reservationTime: "14:30 - 15/12/2024",
    qrCode: "QR123456789"
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScannedCustomer(mockCustomer);
      setIsScanning(false);
      toast({
        title: "Check-in thành công",
        description: `Đã xác nhận đặt lịch cho khách hàng ${mockCustomer.name}`,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div
            className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative z-20 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <QrCode className="h-10 w-10 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Quét QR thông minh</h1>
                <p className="text-white/90 text-lg">Check-in nhanh chóng và chính xác cho khách hàng</p>
              </div>
            </div>
            <Link to="/staff">
              <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Scanner */}
          <div>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in rounded-3xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-gray-800">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                    <span>Quét QR Code khách hàng</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-center text-gray-600 text-base">
                  Quét mã QR của khách hàng để xác nhận đặt lịch và bắt đầu dịch vụ
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-8">
                  <div className={`w-80 h-80 mx-auto border-4 border-dashed rounded-2xl flex items-center justify-center transition-all duration-500 ${isScanning
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
                    }`}>
                    {isScanning ? (
                      <div className="text-center">
                        <div className="animate-spin mb-4">
                          <QrCode className="h-20 w-20 text-blue-600 mx-auto" />
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <p className="text-blue-600 font-semibold mt-2">Đang quét...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Sẵn sàng quét QR Code</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg min-w-[250px]"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin mr-2">
                        <QrCode className="h-5 w-5" />
                      </div>
                      Đang quét...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Bắt đầu quét QR
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Smartphone className="h-6 w-6 mr-2" />
                  Hướng dẫn sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Yêu cầu khách hàng mở ứng dụng",
                  "Khách hàng hiển thị QR code đặt lịch",
                  "Nhấn 'Bắt đầu quét QR' để kích hoạt",
                  "Đưa camera về phía QR code",
                  "Hệ thống sẽ tự động xác nhận"
                ].map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div>
            {scannedCustomer ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    Check-in thành công!
                  </CardTitle>
                  <CardDescription className="text-gray-600">Thông tin khách hàng đã được xác nhận</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { icon: User, label: "Tên khách hàng", value: mockCustomer.name, color: "from-blue-500 to-indigo-500" },
                      { icon: Smartphone, label: "Số điện thoại", value: mockCustomer.phone, color: "from-green-500 to-emerald-500" },
                      { icon: QrCode, label: "Loại xe", value: mockCustomer.vehicle, color: "from-purple-500 to-pink-500" },
                      { icon: Zap, label: "Loại pin", value: mockCustomer.batteryType, color: "from-orange-500 to-yellow-500" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className={`p-3 bg-gradient-to-r ${item.color} rounded-xl`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-gray-600 block">{item.label}</label>
                          <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <label className="text-sm font-semibold text-blue-700 block mb-1">Thời gian hẹn</label>
                      <p className="font-semibold text-blue-800">{mockCustomer.reservationTime}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 flex items-center">
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-1">Trạng thái thanh toán</label>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {mockCustomer.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        const randomSlot = Math.floor(Math.random() * 20) + 1;
                        setBatterySlotNumber(randomSlot);
                        setIsDialogOpen(true);
                        toast({
                          title: "Dịch vụ đã bắt đầu",
                          description: `Pin đang được mở ở ô số ${randomSlot}`,
                        });
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Star className="h-5 w-5 mr-2" />
                      Bắt đầu dịch vụ đổi pin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <QrCode className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-3">Chờ quét QR Code</h3>
                  <p className="text-gray-500">Thông tin khách hàng sẽ hiển thị sau khi quét thành công</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Battery Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse">
                <Box className="h-12 w-12 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Ô pin đang mở</DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              Pin đang được mở ở ô số
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
              <span className="text-6xl font-bold text-white">{batterySlotNumber}</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => setIsDialogOpen(false)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
            >
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCheckIn;
