import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, ArrowLeft, Search, CalendarIcon, TrendingUp, DollarSign, Battery, Users, Clock, MapPin, CreditCard, Eye, Download, Filter, ChevronRight, Zap, Activity, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { getStationPerformanceReports } from "@/services/axios.services";
const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  })
  const [timeRange, setTimeRange] = useState("week")
  const [selectedStationDetails, setSelectedStationDetails] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Derived filtered list based on searchTerm and selectedStation
  const filteredStations = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    const filterByText = (s) => {
      if (!term) return true;
      const name = (s.stationName || "").toLowerCase();
      const address = (s.address || "").toLowerCase();
      return name.includes(term) || address.includes(term);
    };
    const filterBySelect = (s) => {
      if (!selectedStation || selectedStation === "all") return true;
      return String(s.stationId) === String(selectedStation);
    };
    return (stations || []).filter((s) => filterByText(s) && filterBySelect(s));
  }, [stations, searchTerm, selectedStation]);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getStationPerformanceReports();
        const apiStations = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : res?.stations || [];
        setStations(apiStations);
      } catch (e) {
        console.error("Failed to load station performance reports", e);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const getWeeklyTransactions = stationId => {
    const transactions = [{
      id: "TXN001",
      customerName: "Nguyễn Văn A",
      vehicleType: "VinFast VF8",
      batteryType: "Lithium-ion",
      swapTime: "15/01/2024 14:30",
      duration: "3 phút 45 giây",
      amount: "120,000",
      status: "Hoàn thành",
      paymentMethod: "Thẻ tín dụng"
    }, {
      id: "TXN002",
      customerName: "Trần Thị B",
      vehicleType: "VinFast VF9",
      batteryType: "LFP",
      swapTime: "15/01/2024 16:15",
      duration: "4 phút 12 giây",
      amount: "110,000",
      status: "Hoàn thành",
      paymentMethod: "Ví điện tử"
    }, {
      id: "TXN003",
      customerName: "Lê Văn C",
      vehicleType: "VinFast VF6",
      batteryType: "Lithium-ion",
      swapTime: "16/01/2024 09:20",
      duration: "3 phút 28 giây",
      amount: "115,000",
      status: "Hoàn thành",
      paymentMethod: "Chuyển khoản"
    }, {
      id: "TXN004",
      customerName: "Phạm Thị D",
      vehicleType: "VinFast VF8",
      batteryType: "Lithium-ion",
      swapTime: "16/01/2024 11:45",
      duration: "2 phút 56 giây",
      amount: "120,000",
      status: "Hoàn thành",
      paymentMethod: "Thẻ tín dụng"
    }, {
      id: "TXN005",
      customerName: "Hoàng Văn E",
      vehicleType: "VinFast VF9",
      batteryType: "LFP",
      swapTime: "17/01/2024 08:30",
      duration: "4 phút 05 giây",
      amount: "110,000",
      status: "Đang xử lý",
      paymentMethod: "Ví điện tử"
    }];
    return transactions;
  };
  const kpiData = {
    totalRevenue: "2,850,000",
    totalTransactions: 245,
    avgTransaction: "11,633",
    customerSatisfaction: "94%",
    systemUptime: "99.2%",
    batteryUtilization: "87%"
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
    {/* Modern Header */}
    <div className="bg-white border-b border-slate-200/60 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bảng Điều Khiển Phân Tích</h1>
              <p className="text-slate-500 text-sm">Thông tin chi tiết và báo cáo toàn diện</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur-sm">
              <Download className="h-4 w-4" />
              Xuất Dữ Liệu
            </Button>
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Quay Lại
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-6 py-8">
      {loading ? (
        <div className="py-20 flex items-center justify-center text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* Enhanced Filters Section */}
          <div className="mb-8">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-lg"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-2.5 rounded-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">Bộ Lọc Nâng Cao</CardTitle>
                      <CardDescription className="text-slate-600">Tùy chỉnh chế độ xem phân tích của bạn</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    Thời Gian Thực
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tìm Kiếm Trạm</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input placeholder="Tên trạm hoặc địa điểm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Lọc Trạm</label>
                    <Select onValueChange={setSelectedStation}>
                      <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200">
                        <SelectValue placeholder="Tất cả trạm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạm</SelectItem>
                        {stations.map(station => <SelectItem key={station.stationId} value={station.stationId}>
                          {station.stationName}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Khoảng Thời Gian</label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-slate-200">
                        <SelectValue placeholder="Chọn khoảng thời gian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Xem theo tuần</SelectItem>
                        <SelectItem value="month">Xem theo tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced KPI Overview */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-20">
              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.totalRevenue}</h3>
                      <p className="text-xs text-slate-500 font-medium">Tổng Doanh Thu (VNĐ)</p>
                      <div className="flex items-center justify-center text-emerald-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.5%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.totalTransactions}</h3>
                      <p className="text-xs text-slate-500 font-medium">Tổng Giao Dịch</p>
                      <div className="flex items-center justify-center text-blue-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8.3%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.customerSatisfaction}</h3>
                      <p className="text-xs text-slate-500 font-medium">Hài Lòng Khách Hàng</p>
                      <div className="flex items-center justify-center text-purple-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +1.2%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-teal-500/25 transition-all duration-300">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.systemUptime}</h3>
                      <p className="text-xs text-slate-500 font-medium">Thời Gian Hoạt Động</p>
                      <div className="flex items-center justify-center text-teal-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +0.1%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                      <Battery className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.batteryUtilization}</h3>
                      <p className="text-xs text-slate-500 font-medium">Sử Dụng Pin</p>
                      <div className="flex items-center justify-center text-indigo-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.7%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Enhanced Station Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-lg"></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-2.5 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Tổng Quan Hiệu Suất Trạm</CardTitle>
                    <CardDescription className="text-slate-600">
                      Thông tin chi tiết về doanh thu, giao dịch và chỉ số hiệu quả
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {/* show filtered count */}
                  {filteredStations.length} Trạm Hoạt Động
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredStations.map((station, index) => <div key={station.stationId} className="group relative bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="grid lg:grid-cols-6 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                            {station.stationName}
                          </h3>
                          <p className="text-sm text-slate-500 mb-2">{station.address}</p>
                          <div className="flex items-center space-x-2">
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200/60">
                      <div className="text-2xl font-bold text-emerald-700">{station.totalRevenue}</div>
                      <p className="text-xs text-emerald-600 font-medium">Doanh Thu (VNĐ)</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200/60">
                      <div className="text-2xl font-bold text-blue-700">{station.totalTransactions}</div>
                      <p className="text-xs text-blue-600 font-medium">Giao Dịch</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200/60">
                      <div className="text-2xl font-bold text-orange-700">{station.managedBatteries}</div>
                      <p className="text-xs text-orange-600 font-medium">Pin Quản Lý</p>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200/60">
                      <div className="text-2xl font-bold text-purple-700">{station.efficiencyRate}</div>
                      <p className="text-xs text-purple-600 font-medium">Hiệu Suất</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Lịch sử giao dịch hàng tuần</span>
                      </div>
                      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStationDetails(station)} className="bg-white/80 backdrop-blur-sm hover:bg-white border-slate-200 gap-2 group/btn">
                            <Eye className="h-4 w-4 group-hover/btn:text-blue-600 transition-colors" />
                            Xem Chi Tiết
                            <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle className="flex items-center text-xl">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              Chi Tiết Giao Dịch - {selectedStationDetails?.stationName}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600">
                              Lịch sử giao dịch toàn diện cho {selectedStationDetails?.address}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedStationDetails && <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid md:grid-cols-4 gap-4">
                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                                <CardContent className="p-4 text-center">
                                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <CreditCard className="h-6 w-6 text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900">{selectedStationDetails.totalRevenue}</h3>
                                  <p className="text-xs text-slate-500 font-medium">Doanh Thu (VNĐ)</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                                <CardContent className="p-4 text-center">
                                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900">{selectedStationDetails.totalTransactions}</h3>
                                  <p className="text-xs text-slate-500 font-medium">Giao Dịch</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                                <CardContent className="p-4 text-center">
                                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Clock className="h-6 w-6 text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900">3.5 phút</h3>
                                  <p className="text-xs text-slate-500 font-medium">Thời Gian TB</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                                <CardContent className="p-4 text-center">
                                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Users className="h-6 w-6 text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900">{selectedStationDetails.efficiencyRate}</h3>
                                  <p className="text-xs text-slate-500 font-medium">Hiệu Suất</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Transaction Table */}
                            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                              <CardHeader>
                                <CardTitle className="text-lg">Lịch Sử Giao Dịch</CardTitle>
                                <CardDescription>
                                  Phân tích chi tiết các giao dịch thay pin trong tuần này
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="rounded-lg border border-slate-200/60 overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-50/50">
                                        <TableHead className="font-semibold">Mã Giao Dịch</TableHead>
                                        <TableHead className="font-semibold">Khách Hàng</TableHead>
                                        <TableHead className="font-semibold">Xe & Pin</TableHead>
                                        <TableHead className="font-semibold">Thời Gian</TableHead>
                                        <TableHead className="font-semibold">Thời Lượng</TableHead>
                                        <TableHead className="font-semibold">Số Tiền</TableHead>
                                        <TableHead className="font-semibold">Thanh Toán</TableHead>
                                        <TableHead className="font-semibold">Trạng Thái</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {getWeeklyTransactions(selectedStationDetails.id).map(transaction => <TableRow key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-blue-600">{transaction.id}</TableCell>
                                        <TableCell className="font-medium">{transaction.customerName}</TableCell>
                                        <TableCell>
                                          <div>
                                            <div className="font-medium text-slate-900">{transaction.vehicleType}</div>
                                            <div className="text-xs text-slate-500">{transaction.batteryType}</div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{transaction.swapTime}</TableCell>
                                        <TableCell className="text-sm">{transaction.duration}</TableCell>
                                        <TableCell className="font-bold text-emerald-700">
                                          {parseInt(transaction.amount).toLocaleString()} VNĐ
                                        </TableCell>
                                        <TableCell className="text-sm">{transaction.paymentMethod}</TableCell>
                                        <TableCell>
                                          <Badge variant={transaction.status === "Hoàn thành" ? "default" : "secondary"} className={transaction.status === "Hoàn thành" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                                            {transaction.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>)}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </Card>
                          </div>}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>)}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  </div>;
};
export default Reports;
