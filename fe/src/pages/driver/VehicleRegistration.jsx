import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ArrowLeft, Battery, Zap, CheckCircle, Star, Home, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
const VehicleRegistration = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        vin: "",
        carModel: "",
        batteryType: ""
    });
    const handleRegisterVehicle = () => {
        if (!formData.vin || !formData.carModel || !formData.batteryType) {
            toast({
                title: "Lỗi",
                description: "Vui lòng điền đầy đủ thông tin xe",
                variant: "destructive",
            });
            return;
        }
        // Simulate registration process
        toast({
            title: "Đăng ký xe thành công!",
            description: `Xe ${formData.carModel} đã được đăng ký thành công vào hệ thống.`,
        });
        // Reset form
        setFormData({
            vin: "",
            carModel: "",
            batteryType: ""
        });
    };
    const handleUnregisterVehicle = () => {
        toast({
            title: "Hủy đăng ký xe thành công!",
            description: "Xe đã được gỡ khỏi hệ thống.",
        });
    };
    const vinFastModels = [
        "VF e34",
        "VF 8",
        "VF 9",
        "VF 5",
        "VF 6",
        "VF 7"
    ];
    const batteryTypes = [
        "Pin LFP",
        "Ắc quy chì",
        "Lithium-ion"
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-20 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Car className="h-10 w-10 text-white"/>
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
                <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                  <ArrowLeft className="h-5 w-5 mr-2"/>
                  Dashboard
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                  <Home className="h-5 w-5 mr-2"/>
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
                    <Car className="h-6 w-6 text-white"/>
                  </div>
                  Thông tin xe VINFAST
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Đăng ký và liên kết xe điện VINFAST của bạn với hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="vin" className="text-sm font-semibold text-gray-700">Mã VIN</Label>
                  <Input id="vin" placeholder="Nhập mã VIN của xe" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"/>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="carModel" className="text-sm font-semibold text-gray-700">Dòng xe VINFAST</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, carModel: value })}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="Chọn dòng xe"/>
                    </SelectTrigger>
                    <SelectContent>
                      {vinFastModels.map((model) => (<SelectItem key={model} value={model} className="py-3">
                          🚗 {model}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="batteryType" className="text-sm font-semibold text-gray-700">Loại pin</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, batteryType: value })}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="Chọn loại pin"/>
                    </SelectTrigger>
                    <SelectContent>
                      {batteryTypes.map((type) => (<SelectItem key={type} value={type} className="py-3">
                          <div className="flex items-center">
                            <Battery className="h-4 w-4 mr-2 text-blue-600"/>
                            {type}
                            {type === "Lithium-ion" && " (Khuyến nghị)"}
                          </div>
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button onClick={handleRegisterVehicle} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                    <Zap className="h-5 w-5 mr-2"/>
                    Đăng ký xe
                  </Button>
                  <Link to="/driver" className="flex-1">
                    <Button variant="outline" className="w-full h-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105">
                      Hủy bỏ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Star className="h-6 w-6 mr-2"/>
                  Lợi ích khi đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
            "Tìm trạm đổi pin nhanh chóng",
            "Đặt lịch trước để tiết kiệm thời gian",
            "Theo dõi lịch sử và chi phí",
            "Hỗ trợ 24/7 từ đội ngũ kỹ thuật"
        ].map((benefit, index) => (<div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0"/>
                    <span className="text-gray-700">{benefit}</span>
                  </div>))}
              </CardContent>
            </Card>

            {/* Registered Vehicles */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                    <CheckCircle className="h-5 w-5 text-white"/>
                  </div>
                  Xe đã đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                        <Car className="h-6 w-6 text-white"/>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">VF 8 Plus</h3>
                        <p className="text-sm text-gray-600">VIN: VF1A12345678901234</p>
                        <p className="text-sm text-gray-600">Pin: Lithium-ion</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleUnregisterVehicle} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <X className="h-4 w-4 mr-1"/>
                      Hủy đăng ký
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>);
};
export default VehicleRegistration;
