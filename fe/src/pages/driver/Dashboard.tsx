import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, MapPin, Calendar, CreditCard, Battery, Home, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import AccountSettings from "@/components/AccountSettings";

const DriverDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Battery className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Dashboard Tài xế</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cài đặt tài khoản</DialogTitle>
                </DialogHeader>
                <AccountSettings userRole="driver" />
              </DialogContent>
            </Dialog>
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Home className="h-4 w-4 mr-2" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2">Chào mừng bạn!</h2>
          <p className="text-muted-foreground">Quản lý xe điện và dịch vụ đổi pin của bạn</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Car className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h3 className="text-2xl font-bold">1</h3>
              <p className="text-muted-foreground">Xe đã đăng ký</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-2xl font-bold">12</h3>
              <p className="text-muted-foreground">Trạm gần đây</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-2xl font-bold">3</h3>
              <p className="text-muted-foreground">Lịch hẹn</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-charging mx-auto mb-4" />
              <h3 className="text-2xl font-bold">5</h3>
              <p className="text-muted-foreground">Gói thuê bao</p>
            </CardContent>
          </Card>
        </div>

        {/* Hero Section with Background */}
        <div className="relative mb-8 rounded-xl overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/20 to-charging/20" />
          <img 
            src="/src/assets/ev-station-hero.jpg" 
            alt="EV Station" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold mb-1">Hệ thống đổi pin thông minh</h2>
            <p className="text-white/80">Trải nghiệm dịch vụ nhanh chóng và tiện lợi</p>
          </div>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Car className="h-6 w-6 mr-2" />
                Đăng ký & Liên kết xe
              </CardTitle>
              <CardDescription>
                Đăng ký thông tin xe VINFAST và loại pin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/driver/register-vehicle">
                <Button className="w-full">Quản lý xe</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <MapPin className="h-6 w-6 mr-2" />
                Tìm trạm & Tồn kho pin
              </CardTitle>
              <CardDescription>
                Tìm trạm gần nhất và kiểm tra tình trạng pin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/driver/find-stations">
                <Button className="w-full">Tìm trạm</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Calendar className="h-6 w-6 mr-2" />
                Lịch sử đặt chỗ
              </CardTitle>
              <CardDescription>
                Xem lại thông tin booking đã đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/driver/booking-history">
                <Button className="w-full">Xem lịch sử</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Battery className="h-6 w-6 mr-2" />
                Gói thuê pin
              </CardTitle>
              <CardDescription>
                Đăng ký gói thuê bao pin hàng tháng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/driver/subscriptions">
                <Button className="w-full">Xem gói</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;