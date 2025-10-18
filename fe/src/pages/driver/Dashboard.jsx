import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, MapPin, Calendar, CreditCard, Battery, Home, Settings, Zap, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import AccountSettings from "@/components/AccountSettings";
import { viewUserVehicles } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
const DriverDashboard = () => {
  const { userVehicles, setUserVehicles } = useContext(SystemContext);
  useEffect(() => {
    loadUserVehicles();
  }, []);
  const loadUserVehicles = async () => {
    const res = await viewUserVehicles();
    if (res) {
      setUserVehicles(res);
    } else if (res.error) {
      toast({
        title: "Lỗi gọi hiển thị xe",
        description: JSON.stringify(res.error),
        variant: "destructive",
      });
    }
  }
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        </div>
      </header>
      {/* Main Content */}
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng bạn!</h2>
          <p className="text-gray-600">Quản lý xe điện và dịch vụ đổi pin của bạn</p>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Car, count: "1", label: "Xe đã đăng ký", color: "from-blue-500 to-indigo-500" },
            { icon: MapPin, count: "12", label: "Trạm gần đây", color: "from-green-500 to-emerald-500" },
            { icon: Calendar, count: "3", label: "Lịch hẹn", color: "from-orange-500 to-yellow-500" },
            { icon: CreditCard, count: "5", label: "Gói thuê bao", color: "from-purple-500 to-pink-500" }
          ].map((stat, index) => (<Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6 text-center group-hover:scale-105 transition-transform duration-300">
              <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl mx-auto mb-4 w-fit`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-gray-800">{stat.count}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </CardContent>
          </Card>))}
        </div>

        {/* Enhanced Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden animate-fade-in group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90" />
          <img src="/src/assets/ev-station-hero.jpg" alt="EV Station" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-6 flex flex-col justify-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-3 text-white">Hệ thống đổi pin thông minh</h2>
              <p className="text-white/90 text-lg mb-6">Trải nghiệm dịch vụ nhanh chóng và tiện lợi với công nghệ AI hiện đại</p>
              <div className="flex items-center space-x-6 text-white/80 text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  99.8% uptime
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  4.9/5 đánh giá
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {[
            { icon: Car, title: "Đăng ký & Liên kết xe", desc: "Đăng ký thông tin xe VINFAST và loại pin", link: "/driver/register-vehicle", color: "from-blue-500 to-indigo-500" },
            { icon: MapPin, title: "Tìm trạm & Tồn kho pin", desc: "Tìm trạm gần nhất và kiểm tra tình trạng pin", link: "/driver/find-stations", color: "from-green-500 to-emerald-500" },
            { icon: Calendar, title: "Lịch sử đặt chỗ", desc: "Xem lại thông tin booking đã đăng ký", link: "/driver/booking-history", color: "from-orange-500 to-yellow-500" },
            { icon: Battery, title: "Gói thuê pin", desc: "Đăng ký gói thuê bao pin hàng tháng", link: "/driver/subscriptions", color: "from-purple-500 to-pink-500" }
          ].map((feature, index) => (<Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                <div className={`p-3 bg-gradient-to-r ${feature.color} rounded-xl mr-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                {feature.title}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {feature.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to={feature.link}>
                <Button className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}>
                  <Zap className="h-5 w-5 mr-2" />
                  Truy cập ngay
                </Button>
              </Link>
            </CardContent>
          </Card>))}
        </div>
      </div>
    </div>);
};
export default DriverDashboard;
