import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, CreditCard, Battery, Search, BarChart3, Home, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import AccountSettings from "@/components/AccountSettings";

const StaffDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Battery className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Dashboard Nhân viên</h1>
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
                <AccountSettings userRole="staff" />
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
        <div className="mb-8 animate-fade-in flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Chào mừng nhân viên!</h2>
            <p className="text-muted-foreground">Quản lý trạm đổi pin và dịch vụ khách hàng</p>
          </div>
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-electric-blue">
                <Battery className="h-5 w-5 mr-2" />
                Trạm đang quản lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tên trạm:</span>
                  <span className="text-sm font-medium">Trạm Bình Thạnh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Địa chỉ:</span>
                  <span className="text-sm font-medium">789 Xô Viết Nghệ Tĩnh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <span className="text-sm font-medium text-success">Đang hoạt động</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pin khả dụng:</span>
                  <span className="text-sm font-medium">45/60</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <QrCode className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h3 className="text-2xl font-bold">23</h3>
              <p className="text-muted-foreground">QR đã quét hôm nay</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-2xl font-bold">8</h3>
              <p className="text-muted-foreground">Thanh toán chờ xử lý</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Battery className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-2xl font-bold">45</h3>
              <p className="text-muted-foreground">Pin trong kho</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-charging mx-auto mb-4" />
              <h3 className="text-2xl font-bold">3</h3>
              <p className="text-muted-foreground">Pin cần kiểm tra</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-6 animate-scale-in">
          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <QrCode className="h-6 w-6 mr-2" />
                Check-in QR & Đổi pin
              </CardTitle>
              <CardDescription>
                Quét QR code khách hàng và thực hiện đổi pin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/staff/qr-checkin">
                <Button className="w-full">Quét QR</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <CreditCard className="h-6 w-6 mr-2" />
                Lịch sử giao dịch
              </CardTitle>
              <CardDescription>
                Theo dõi lịch sử giao dịch đã xác nhận
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/staff/transaction-history">
                <Button className="w-full">Xem lịch sử</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Battery className="h-6 w-6 mr-2" />
                Quản lý tồn kho pin
              </CardTitle>
              <CardDescription>
                Theo dõi và quản lý trạng thái pin tại trạm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/staff/battery-inventory">
                <Button className="w-full">Quản lý kho</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="flex items-center text-electric-blue">
                <Search className="h-6 w-6 mr-2" />
                Kiểm tra/Giám định pin
              </CardTitle>
              <CardDescription>
                Kiểm tra tình trạng pin và quyết định bảo trì
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/staff/battery-inspection">
                <Button className="w-full">Kiểm tra pin</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;