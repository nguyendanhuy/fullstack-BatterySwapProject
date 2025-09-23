import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ArrowLeft, Battery } from "lucide-react";
import { Link } from "react-router-dom";

const VehicleRegistration = () => {
  const [formData, setFormData] = useState({
    vin: "",
    carModel: "",
    batteryType: ""
  });

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Battery className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Đăng ký xe</h1>
          </div>
          <Link to="/driver">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Car className="h-6 w-6 mr-2" />
                Thông tin xe VINFAST
              </CardTitle>
              <CardDescription>
                Đăng ký và liên kết xe điện VINFAST của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vin">Mã VIN</Label>
                <Input
                  id="vin"
                  placeholder="Nhập mã VIN của xe"
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carModel">Dòng xe VINFAST</Label>
                <Select onValueChange={(value) => setFormData({...formData, carModel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dòng xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vinFastModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batteryType">Loại pin</Label>
                <Select onValueChange={(value) => setFormData({...formData, batteryType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại pin" />
                  </SelectTrigger>
                  <SelectContent>
                    {batteryTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="flex-1" size="lg">
                  Đăng ký xe
                </Button>
                <Link to="/driver" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg">
                    Hủy bỏ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Registered Vehicles */}
          <Card className="mt-6 animate-slide-up">
            <CardHeader>
              <CardTitle>Xe đã đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">VF 8 Plus</h3>
                    <p className="text-sm text-muted-foreground">VIN: VF1A12345678901234</p>
                    <p className="text-sm text-muted-foreground">Pin: Lithium-ion</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Xóa xe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistration;