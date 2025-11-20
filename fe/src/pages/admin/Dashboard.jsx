import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, TrendingUp, Users, Battery, MapPin, Home, Settings, DollarSign, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import AccountSettings from "@/components/AccountSettings";
const AdminDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (<div className="min-h-screen bg-background">
    {/* Header with gradient background like the image */}
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard Quản trị</h1>
            <p className="text-blue-100 text-sm">Quản lý toàn bộ hệ thống trạm đổi pin</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm">Hệ thống hoạt động</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-sm">Hiệu suất cao</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/20">
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cài đặt tài khoản</DialogTitle>
                </DialogHeader>
                <AccountSettings userRole="admin" />
              </DialogContent>
            </Dialog>
            <Link to="/">
              <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/20">
                <Home className="h-4 w-4 mr-2" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>

    <div className="container mx-auto p-6">
      <div className="grid lg:grid-cols-1 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-1">
          {/* Welcome message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Chào mừng quản trị viên!</h2>
            <p className="text-gray-600">Quản lý và giám sát toàn bộ mạng lưới trạm đổi pin</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">2.85M</h3>
                <p className="text-gray-600 text-sm">Doanh thu (VNĐ)</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">1,248</h3>
                <p className="text-gray-600 text-sm">Người dùng hoạt động</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Battery className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">156</h3>
                <p className="text-gray-600 text-sm">Lần đổi pin hôm nay</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">12</h3>
                <p className="text-gray-600 text-sm">Trạm hoạt động</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Báo cáo tổng hợp
                </CardTitle>
                <CardDescription>
                  Xem báo cáo chi tiết về doanh thu, KPI và hiệu suất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/reports">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                    Xem báo cáo
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Điều phối pin
                </CardTitle>
                <CardDescription>
                  Quản lý phân phối và chuyển pin giữa các trạm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/battery-dispatch">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">
                    Điều phối pin
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Quản lý nhân viên
                </CardTitle>
                <CardDescription>
                  Phân công nhân viên cho các trạm đổi pin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/staff-management">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md">
                    Quản lý nhân viên
                  </Button>
                </Link>
              </CardContent>
            </Card>


            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  Quản lý Giá cả
                </CardTitle>
                <CardDescription>
                  Điều chỉnh giá dịch vụ và gói đăng ký
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/price-management">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md">
                    Quản lý giá
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  Quản lý Xe
                </CardTitle>
                <CardDescription>
                  Quản lý thông tin xe và import từ CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/vehicle-management">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md">
                    Quản lý xe
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  </div>);
};
export default AdminDashboard;
