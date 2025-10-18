import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, ArrowLeft, Search, User, Battery, Clock, CheckCircle, CreditCard, Star } from "lucide-react";
import { Link } from "react-router-dom";
const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const transactions = [
    {
      id: "TXN001",
      customerName: "Nguyễn Văn A",
      phone: "0123456789",
      vehicle: "VF 8 Plus",
      batteryType: "Lithium-ion",
      stationLocation: "Trạm Quận 1",
      confirmationTime: "14:30 - 15/12/2024",
      swapTime: "14:35 - 15/12/2024",
      amount: "150,000",
      status: "Hoàn thành",
      qrCode: "QR123456789",
      rating: 5
    },
    {
      id: "TXN002",
      customerName: "Trần Thị B",
      phone: "0987654321",
      vehicle: "VF e34",
      batteryType: "Pin LFP",
      stationLocation: "Trạm Quận 3",
      confirmationTime: "15:00 - 15/12/2024",
      swapTime: "15:05 - 15/12/2024",
      amount: "120,000",
      status: "Hoàn thành",
      qrCode: "QR987654321",
      rating: 4
    },
    {
      id: "TXN003",
      customerName: "Lê Văn C",
      phone: "0555666777",
      vehicle: "VF 9",
      batteryType: "Lithium-ion",
      stationLocation: "Trạm Bình Thạnh",
      confirmationTime: "16:30 - 15/12/2024",
      swapTime: "16:33 - 15/12/2024",
      amount: "150,000",
      status: "Hoàn thành",
      qrCode: "QR555666777",
      rating: 5
    }
  ];
  return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* Enhanced Header */}
    <header className="bg-white dark:bg-slate-900 border-b">
      <div className="container mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold text-foreground">Lịch sử giao dịch</h1>
      </div>
    </header>

    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Search and Filter */}
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            Tìm kiếm giao dịch
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Tìm kiếm và lọc lịch sử giao dịch đổi pin theo nhiều tiêu chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Tìm theo tên, số điện thoại, mã giao dịch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl" />
            </div>
            <Select onValueChange={setFilterStatus}>
              <SelectTrigger className="w-64 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-8 transition-all duration-300 hover:scale-105">
              <Search className="h-5 w-5 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-6">
        {transactions.map((transaction, index) => (<Card key={transaction.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm group rounded-3xl overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{transaction.customerName}</h3>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < transaction.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />))}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {transaction.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl">
                  <p className="flex items-center">
                    <span className="text-gray-600 w-20">SĐT:</span>
                    <span className="font-semibold text-gray-800">{transaction.phone}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-gray-600 w-20">Mã GD:</span>
                    <span className="font-semibold text-blue-600">{transaction.id}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-gray-600 w-20">QR:</span>
                    <span className="font-semibold text-purple-600">{transaction.qrCode}</span>
                  </p>
                </div>
              </div>

              {/* Vehicle & Battery Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Thông tin xe & pin
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-700 font-semibold mb-1">Xe:</p>
                    <p className="font-bold text-purple-800">{transaction.vehicle}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-700 font-semibold mb-1">Pin:</p>
                    <p className="font-bold text-orange-800">{transaction.batteryType}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Trạm:</p>
                    <p className="font-bold text-blue-800">{transaction.stationLocation}</p>
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center text-gray-800">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Thời gian
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700 font-semibold mb-1">Xác nhận:</p>
                    <p className="font-bold text-green-800">{transaction.confirmationTime}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Đổi pin:</p>
                    <p className="font-bold text-blue-800">{transaction.swapTime}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800">Thanh toán</h4>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="text-4xl font-bold text-green-600 mb-2">{transaction.amount}</div>
                    <p className="text-green-700 font-semibold">VNĐ</p>
                  </div>
                  <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 p-3 rounded-xl">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Đã thanh toán</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-8 border-0 shadow-lg bg-white animate-scale-in rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
            <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl mr-4">
              <History className="h-6 w-6 text-white" />
            </div>
            Thống kê giao dịch hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { value: "23", label: "Tổng giao dịch", color: "from-blue-500 to-indigo-500", icon: History },
              { value: "21", label: "Hoàn thành", color: "from-green-500 to-emerald-500", icon: CheckCircle },
              { value: "2", label: "Đang xử lý", color: "from-orange-500 to-yellow-500", icon: Clock },
              { value: "3,420,000", label: "Tổng doanh thu (VNĐ)", color: "from-purple-500 to-pink-500", icon: CreditCard }
            ].map((stat, index) => (<div key={index} className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl mx-auto mb-4 w-fit`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>);
};
export default TransactionHistory;
