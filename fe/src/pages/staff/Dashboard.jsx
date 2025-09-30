import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, CreditCard, Battery, Search, BarChart3, Home, Settings, Zap, Star, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import AccountSettings from "@/components/AccountSettings";
import { getInfoByToken } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
const StaffDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* Enhanced Header with Glass Effect */}
    <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-repeat animate-pulse" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Content */}
      <div className="relative z-20 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Battery className="h-10 w-10 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard Nhân viên</h1>
              <p className="text-white/90 text-lg">Quản lý trạm đổi pin và dịch vụ khách hàng</p>
              <div className="flex items-center mt-2 space-x-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Trạm đang hoạt động
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Hiệu suất cao
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                  <Settings className="h-5 w-5 mr-2" />
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
              <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                <Home className="h-5 w-5 mr-2" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8 animate-fade-in flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng nhân viên!</h2>
          <p className="text-gray-600">Quản lý trạm đổi pin và dịch vụ khách hàng hiệu quả</p>
        </div>

        {/* Station Info Card */}
        <Card className="w-96 border-0 shadow-lg bg-white animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-gray-800">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                <Battery className="h-5 w-5 text-white" />
              </div>
              Trạm đang quản lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tên trạm:</span>
                <span className="text-sm font-semibold text-gray-800">Trạm Bình Thạnh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Địa chỉ:</span>
                <span className="text-sm font-semibold text-gray-800">789 Xô Viết Nghệ Tĩnh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                <span className="text-sm font-semibold text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Đang hoạt động
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pin khả dụng:</span>
                <span className="text-sm font-semibold text-blue-600">45/60</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { icon: QrCode, count: "23", label: "QR đã quét hôm nay", color: "from-blue-500 to-indigo-500" },
          { icon: CreditCard, count: "8", label: "Thanh toán chờ xử lý", color: "from-green-500 to-emerald-500" },
          { icon: Battery, count: "45", label: "Pin trong kho", color: "from-orange-500 to-yellow-500" },
          { icon: Search, count: "3", label: "Pin cần kiểm tra", color: "from-purple-500 to-pink-500" }
        ].map((stat, index) => (<Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardContent className="p-6 text-center group-hover:scale-105 transition-transform duration-300">
            <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl mx-auto mb-4 w-fit group-hover:rotate-6 transition-transform duration-300`}>
              <stat.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">{stat.count}</h3>
            <p className="text-gray-600 font-medium text-sm">{stat.label}</p>
          </CardContent>
        </Card>))}
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: TrendingUp, title: "Hiệu suất hôm nay", value: "96%", desc: "Tăng 5% so với hôm qua", color: "from-green-500 to-emerald-500" },
          { icon: Users, title: "Khách hàng phục vụ", value: "47", desc: "Trung bình 3.2 phút/lượt", color: "from-blue-500 to-indigo-500" },
          { icon: Star, title: "Đánh giá dịch vụ", value: "4.8/5", desc: "Từ 32 đánh giá", color: "from-purple-500 to-pink-500" }
        ].map((metric, index) => (<Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 bg-gradient-to-r ${metric.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{metric.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{metric.desc}</p>
          </CardContent>
        </Card>))}
      </div>

      {/* Enhanced Main Features */}
      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            icon: QrCode,
            title: "Check-in QR & Đổi pin",
            desc: "Quét QR code khách hàng và thực hiện đổi pin nhanh chóng",
            link: "/staff/qr-checkin",
            color: "from-blue-500 to-indigo-500",
            badge: "Chức năng chính"
          },
          {
            icon: CreditCard,
            title: "Lịch sử giao dịch",
            desc: "Theo dõi và quản lý lịch sử giao dịch đã xác nhận",
            link: "/staff/transaction-history",
            color: "from-green-500 to-emerald-500",
            badge: "Báo cáo"
          },
          {
            icon: Battery,
            title: "Quản lý tồn kho pin",
            desc: "Theo dõi và quản lý trạng thái pin tại trạm",
            link: "/staff/battery-inventory",
            color: "from-orange-500 to-yellow-500",
            badge: "Quản lý kho"
          },
          {
            icon: Search,
            title: "Kiểm tra/Giám định pin",
            desc: "Kiểm tra tình trạng pin và quyết định bảo trì",
            link: "/staff/battery-inspection",
            color: "from-purple-500 to-pink-500",
            badge: "Chất lượng"
          }
        ].map((feature, index) => (<Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-gradient-to-r ${feature.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </div>
              </div>
              <Badge className={`bg-gradient-to-r ${feature.color} text-white border-0`}>
                {feature.badge}
              </Badge>
            </div>
            <CardDescription className="text-gray-600 text-base leading-relaxed">
              {feature.desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to={feature.link}>
              <Button className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group-hover:shadow-2xl`}>
                <Zap className="h-5 w-5 mr-2" />
                Truy cập ngay
                <CheckCircle className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </CardContent>
        </Card>))}
      </div>

      {/* Today's Summary */}
      <Card className="mt-8 border-0 shadow-lg bg-white animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
            <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl mr-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Tóm tắt ca làm việc hôm nay
          </CardTitle>
          <CardDescription className="text-gray-600">Hiệu suất và thành tích trong ngày</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Giao dịch hoàn thành", value: "23", icon: CheckCircle, color: "text-green-600" },
              { label: "Thời gian trung bình", value: "3.2 phút", icon: Clock, color: "text-blue-600" },
              { label: "Pin đã kiểm tra", value: "12", icon: Battery, color: "text-orange-600" },
              { label: "Đánh giá trung bình", value: "4.8/5", icon: Star, color: "text-purple-600" }
            ].map((item, index) => (<div key={index} className="text-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{item.value}</h3>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>);
};
export default StaffDashboard;
