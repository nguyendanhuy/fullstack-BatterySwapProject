import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "antd";
import {
  QrCode, CreditCard, Battery, Search, BarChart3,
  Zap, Star, TrendingUp, Users, CheckCircle, Clock, FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const StaffDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">DashBoard</h1>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Chào mừng nhân viên!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý trạm đổi pin và dịch vụ khách hàng hiệu quả
          </p>
        </div>

        {/* STATION STATUS CARD */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 animate-fade-in hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4">
            <CardTitle className="text-xl flex items-center">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mr-2">
                <Battery className="h-5 w-5 text-white" />
              </div>
              Trạm đang quản lý
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Thông tin trạm */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md mb-6 border border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Battery className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Tên trạm</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      Trạm Bình Thạnh
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Trạng thái</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      Hoạt động
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-700/30 rounded-lg border border-blue-200 dark:border-blue-800 col-span-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md">
                    <Battery className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pin khả dụng</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">45/60</p>
                      <Progress percent={75} showInfo={false} strokeColor="#3b82f6" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DAILY STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { icon: QrCode, count: "23", label: "QR đã quét", color: "from-blue-500 to-indigo-500" },
                { icon: CreditCard, count: "8", label: "Chờ thanh toán", color: "from-green-500 to-emerald-500" },
                { icon: Battery, count: "45", label: "Pin trong kho", color: "from-orange-500 to-yellow-500" },
                { icon: Search, count: "3", label: "Cần kiểm tra", color: "from-purple-500 to-pink-500" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 text-center"
                >
                  <div className={`inline-flex items-center justify-center p-2 rounded-full bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2">{stat.count}</h3>
                  <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* PERFORMANCE */}
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, title: "Hiệu suất", value: "96%", color: "from-green-500 to-emerald-500" },
                { icon: Users, title: "Khách hàng", value: "47", color: "from-blue-500 to-indigo-500" },
                { icon: Star, title: "Đánh giá", value: "4.8/5", color: "from-purple-500 to-pink-500" }
              ].map((metric, index) => (
                <div
                  key={index}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center space-x-3"
                >
                  <div className={`p-2 bg-gradient-to-br ${metric.color} rounded-lg`}>
                    <metric.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{metric.title}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* MAIN FEATURES */}
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
              icon: FileText,
              title: "Lịch sử Swap",
              desc: "Xem lịch sử swap (đổi pin) đã thực hiện tại trạm",
              link: "/staff/swap-history",
              color: "from-blue-500 to-indigo-500",
              badge: "Swap"
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
            },
            {
              icon: TrendingUp,
              title: "Quản lý tranh chấp pin",
              desc: "Xem và xử lý các tranh chấp liên quan đến pin",
              link: "/staff/battery-dispute",
              color: "from-red-500 to-pink-500",
              badge: "Tranh chấp"
            }
          ].map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-gradient-to-r ${feature.color} rounded-xl`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                  <Badge className={`bg-gradient-to-r ${feature.color} text-white border-0`}>
                    {feature.badge}
                  </Badge>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{feature.desc}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to={feature.link}>
                  <Button className={`w-full bg-gradient-to-r ${feature.color} text-white rounded-xl py-4 text-lg font-semibold hover:scale-105 transition`}>
                    <Zap className="h-5 w-5 mr-2" />
                    Truy cập ngay
                    <CheckCircle className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TODAY SUMMARY */}
        <Card className="mt-8 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl mr-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Tóm tắt ca làm việc hôm nay
            </CardTitle>
            <CardDescription>Hiệu suất và thành tích trong ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: "Giao dịch hoàn thành", value: "23", icon: CheckCircle, color: "text-green-600" },
                { label: "Thời gian trung bình", value: "3.2 phút", icon: Clock, color: "text-blue-600" },
                { label: "Pin đã kiểm tra", value: "12", icon: Battery, color: "text-orange-600" },
                { label: "Đánh giá trung bình", value: "4.8/5", icon: Star, color: "text-purple-600" }
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{item.value}</h3>
                  <p className="text-sm text-gray-600">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;
