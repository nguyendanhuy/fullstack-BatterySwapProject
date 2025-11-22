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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ArrowLeft, Search, CalendarIcon, TrendingUp, DollarSign, Battery, Users, Clock, MapPin, CreditCard, Eye, Download, Filter, ChevronRight, Activity, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { getStationPerformanceReports, exportReportByRangeDate, swapHourlyReport, swapDaylyReport, revenueHourlyReport, revenueDaylyReport, getStationReportByRangeDate } from "../../services/axios.services";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ComposedChart, Line } from 'recharts';
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { Pagination } from 'antd';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [timeRange, setTimeRange] = useState("7")
  const [selectedStationDetails, setSelectedStationDetails] = useState(null);
  const [stationTransactions, setStationTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // States for analytics chart
  const [chartViewMode, setChartViewMode] = useState("daily"); // "hourly" or "daily"
  const [chartLoading, setChartLoading] = useState(false);
  const [chartDateRange, setChartDateRange] = useState({
    from: subDays(new Date(), 7), // Default: 7 days ago
    to: new Date()
  });
  const [chartData, setChartData] = useState([]);

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
        setStations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load chart data when view mode or date range changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!chartDateRange.from || !chartDateRange.to) return;
      try {
        setChartLoading(true);

        let startDate, endDate;

        if (chartViewMode === "hourly") {
          // For hourly view, use only today (24 hours)
          const today = new Date();
          const yesterday = subDays(today, 3);
          startDate = format(yesterday, "yyyy-MM-dd");
          endDate = format(today, "yyyy-MM-dd");
        } else {
          // For daily view, use selected date range
          startDate = format(chartDateRange.from, "yyyy-MM-dd");
          endDate = format(chartDateRange.to, "yyyy-MM-dd");
        }

        let swapData, revenueData, swapSummary, revenueSummary;

        if (chartViewMode === "hourly") {
          // Call hourly APIs sequentially
          const swapRes = await swapHourlyReport(startDate, endDate);
          const revenueRes = await revenueHourlyReport(startDate, endDate);
          swapData = swapRes?.data?.rows || [];
          revenueData = revenueRes?.data?.rows || [];
          swapSummary = swapRes?.data?.summary || {};
          revenueSummary = revenueRes?.data?.summary || {};
        } else {
          // Call daily APIs sequentially
          const swapRes = await swapDaylyReport(startDate, endDate);
          const revenueRes = await revenueDaylyReport(startDate, endDate);
          swapData = swapRes?.data?.rows || [];
          revenueData = revenueRes?.data?.rows || [];
          swapSummary = swapRes?.data?.summary || {};
          revenueSummary = revenueRes?.data?.summary || {};
        }
        // Merge data by date (and hour if hourly)
        const mergedData = {};

        swapData.forEach(item => {
          const key = chartViewMode === "hourly"
            ? `${item.date}_${item?.hour}`
            : item.date;

          mergedData[key] = {
            date: item.date,
            hour: item?.hour,
            swapCount: item.swapCount || 0,
            totalRevenue: 0,
            transactions: 0
          };
        });

        revenueData.forEach(item => {
          const key = chartViewMode === "hourly"
            ? `${item.date}_${item?.hour}`
            : item.date;

          if (mergedData[key]) {
            mergedData[key].totalRevenue = item.totalRevenue || 0;
            mergedData[key].transactions = item.transactions || 0;
          } else {
            mergedData[key] = {
              date: item.date,
              hour: item?.hour,
              swapCount: 0,
              totalRevenue: item.totalRevenue || 0,
              transactions: item.transactions || 0
            };
          }
        });

        // Convert to array and sort
        const chartArray = Object.values(mergedData).sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return (a.hour || 0) - (b.hour || 0);
        });

        setChartData({
          rows: chartArray,
          summary: {
            totalRevenue: revenueSummary.totalRevenue || 0,
            totalSwaps: swapSummary.totalSwaps || 0,
            rowsCount: chartArray.length
          }
        });
      } catch (error) {
        setChartData({ rows: [], summary: {} });
        const errorMessage = error.response?.data?.message ||
          error.message ||
          "Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.";
        toast.error(errorMessage);
      } finally {
        setChartLoading(false);
      }
    };
    loadChartData();
  }, [chartViewMode, chartDateRange]);

  // Load station transactions when station or time range changes
  useEffect(() => {
    const loadStationTransactions = async () => {
      if (!selectedStationDetails?.stationId) {
        setStationTransactions([]);
        return;
      }
      try {
        setTransactionsLoading(true);
        const response = await getStationReportByRangeDate(
          selectedStationDetails.stationId,
          parseInt(timeRange)
        );

        const transactions = response?.data?.transactions || [];
        setStationTransactions(transactions);
        setCurrentPage(1); // Reset to first page when data changes
      } catch (error) {
        setStationTransactions([]);
        const errorMessage = error.response?.data?.message ||
          error.message ||
          "Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.";
        toast.error(errorMessage);
      } finally {
        setTransactionsLoading(false);
      }
    };

    loadStationTransactions();
  }, [selectedStationDetails?.stationId, timeRange]);

  const kpiData = useMemo(() => {
    if (!stations || stations.length === 0) {
      return {
        totalRevenue: "0",
        totalTransactions: 0,
        totalBatteries: 0,
        avgEfficiency: "0%"
      };
    }
    const totalRevenue = stations.reduce((sum, station) => {
      const revenue = parseFloat(station.totalRevenue || 0);
      return sum + revenue;
    }, 0);
    const totalTransactions = stations.reduce((sum, station) => {
      return sum + (parseInt(station.totalTransactions) || 0);
    }, 0);
    const totalBatteries = stations.reduce((sum, station) => {
      return sum + (parseInt(station.managedBatteries) || 0);
    }, 0);
    const avgEfficiency = stations.reduce((sum, station) => {
      const efficiency = parseFloat(station.efficiencyRate || 0);
      return sum + efficiency;
    }, 0) / stations.length;
    return {
      totalRevenue: totalRevenue.toLocaleString('vi-VN'),
      totalTransactions: totalTransactions,
      totalBatteries: totalBatteries,
      avgEfficiency: `${avgEfficiency.toFixed(1)}%`
    };
  }, [stations]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return stationTransactions.slice(startIndex, endIndex);
  }, [stationTransactions, currentPage, pageSize]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const exportReport = async () => {
    try {
      //lấy report của 6 tháng trước đến hiện tại
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 180), "yyyy-MM-dd");
      const response = await exportReportByRangeDate(startDate, endDate);
      console.log("Export response:", response, endDate, startDate);
      const url = response.downloadUrl.replace("http://", "https://");
      const a = document.createElement("a");
      a.href = url;
      a.download = "report.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data || error?.message || "Có lỗi xảy ra");
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
    {/* Header */}
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
            <Button onClick={exportReport} variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur-sm">
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
          {/* Filters Section */}
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Overview */}
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                      <Battery className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.totalBatteries}</h3>
                      <p className="text-xs text-slate-500 font-medium">Tổng Pin Quản Lý</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-48 flex-shrink-0">
                <Card className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg"></div>
                  <CardContent className="p-5 text-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">{kpiData.avgEfficiency}</h3>
                      <p className="text-xs text-slate-500 font-medium">Hiệu Suất Trung Bình</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* ----- BẮT ĐẦU TABS CHÍNH ----- */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 backdrop-blur-sm mb-6 shadow-inner">
              <TabsTrigger value="list">Xem Theo Danh Sách</TabsTrigger>
              <TabsTrigger value="analytics">Phân Tích Swap & Doanh Thu</TabsTrigger>
            </TabsList>

            {/* ----- TAB 0: ANALYTICS CHART ----- */}
            <TabsContent value="analytics">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-lg"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-2.5 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-900">Phân Tích Swap & Doanh Thu</CardTitle>
                        <CardDescription className="text-slate-600">
                          Theo dõi số lần swap và doanh thu theo thời gian
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Cards - Hiển thị tổng từ API */}
                  {!chartLoading && chartData.rows?.length > 0 && chartData.summary && (
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-emerald-600">Tổng Doanh Thu</p>
                              <h3 className="text-2xl font-bold text-emerald-700">
                                {(chartData.summary.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
                              </h3>
                            </div>
                            <div className="bg-emerald-500 p-3 rounded-lg">
                              <DollarSign className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Tổng Số Lần Swap</p>
                              <h3 className="text-2xl font-bold text-blue-700">
                                {(chartData.summary.totalSwaps || 0).toLocaleString('vi-VN')}
                              </h3>
                            </div>
                            <div className="bg-blue-500 p-3 rounded-lg">
                              <Activity className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Controls */}
                  <div className={`grid gap-4 mb-6 lg:grid-cols-3`}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Chế Độ Xem</label>
                      <Select value={chartViewMode} onValueChange={setChartViewMode}>
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200">
                          <SelectValue placeholder="Chọn chế độ xem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Theo Giờ (3 ngày)</SelectItem>
                          <SelectItem value="daily">Theo Ngày</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {chartViewMode === "daily" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Từ Ngày</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-slate-200">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {chartDateRange.from ? format(chartDateRange.from, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={chartDateRange.from}
                                onSelect={(date) => setChartDateRange(prev => ({ ...prev, from: date || new Date() }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Đến Ngày</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-slate-200">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {chartDateRange.to ? format(chartDateRange.to, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={chartDateRange.to}
                                onSelect={(date) => setChartDateRange(prev => ({ ...prev, to: date || new Date() }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chart */}
                  {chartLoading ? (
                    <div className="py-20 flex items-center justify-center text-slate-600">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Đang tải dữ liệu biểu đồ...
                    </div>
                  ) : (chartData.rows?.length || 0) === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                      Không có dữ liệu cho khoảng thời gian đã chọn
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 500 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData.rows} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey={(item) => {
                              if (chartViewMode === "hourly") {
                                return `${item.date} ${item.hour}h`;
                              }
                              return format(new Date(item.date), "dd/MM");
                            }}
                            stroke="#555"
                            angle={-30}
                            textAnchor="end"
                            interval={0}
                            height={80}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#10b981"
                            label={{ value: 'Doanh Thu (VNĐ)', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#3b82f6"
                            label={{ value: 'Số Lần Swap', angle: 90, position: 'insideRight' }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(5px)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.5rem'
                            }}
                            formatter={(value, name) => {
                              if (name === 'Doanh Thu') return [value.toLocaleString('vi-VN') + ' VNĐ', name];
                              if (name === 'Số Lần Swap') return [value, name];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Thời gian: ${label}`}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar
                            yAxisId="left"
                            dataKey="totalRevenue"
                            name="Doanh Thu"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="swapCount"
                            name="Số Lần Swap"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ----- TAB 1: DANH SÁCH ----- */}
            <TabsContent value="list">
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

                          <Dialog>
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
                                  Lịch sử giao dịch và phân tích cho {selectedStationDetails?.address}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedStationDetails && <div className="space-y-6">
                                {/* 4 Thẻ KPI trong Dialog */}
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
                                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-lg">Lịch Sử Giao Dịch</CardTitle>
                                        <CardDescription>
                                          Phân tích chi tiết các giao dịch thay pin
                                        </CardDescription>
                                      </div>
                                      <div className="w-48">
                                        <Select value={timeRange} onValueChange={setTimeRange}>
                                          <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-200">
                                            <SelectValue placeholder="Chọn khoảng thời gian" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1"> Xem theo ngày</SelectItem>
                                            <SelectItem value="7">Xem theo tuần</SelectItem>
                                            <SelectItem value="30">Xem theo tháng</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    {transactionsLoading ? (
                                      <div className="py-12 flex items-center justify-center text-slate-600">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Đang tải dữ liệu giao dịch...
                                      </div>
                                    ) : stationTransactions.length === 0 ? (
                                      <div className="py-12 text-center text-slate-500">
                                        Không có giao dịch trong khoảng thời gian này
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border border-slate-200/60 overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                              <TableHead className="font-semibold">Mã Giao Dịch</TableHead>
                                              <TableHead className="font-semibold">Khách Hàng</TableHead>
                                              <TableHead className="font-semibold">Xe & Pin</TableHead>
                                              <TableHead className="font-semibold">Thời Gian</TableHead>
                                              <TableHead className="font-semibold">Số Tiền</TableHead>
                                              <TableHead className="font-semibold">Thanh Toán</TableHead>
                                              <TableHead className="font-semibold">Trạng Thái</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {paginatedTransactions.map(transaction => <TableRow key={transaction.transactionId} className="hover:bg-slate-50/50 transition-colors">
                                              <TableCell className="font-medium text-blue-600">{transaction.transactionId}</TableCell>
                                              <TableCell className="font-medium">{transaction.customerName}</TableCell>
                                              <TableCell>
                                                <div className="whitespace-pre-line text-sm">
                                                  {transaction.vehicleAndBattery}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-sm">{transaction.time}</TableCell>
                                              <TableCell className="font-bold text-emerald-700">
                                                {transaction.amount}
                                              </TableCell>
                                              <TableCell className="text-sm">{transaction.paymentMethod}</TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant={transaction.status === "Hoàn thành" ? "default" : transaction.status === "Đã hủy" ? "destructive" : "secondary"}
                                                  className={
                                                    transaction.status === "Hoàn thành"
                                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                      : transaction.status === "Đã hủy"
                                                        ? "bg-red-100 text-red-700 border-red-200"
                                                        : ""
                                                  }
                                                >
                                                  {transaction.status}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>)}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}

                                    {/* Pagination */}
                                    {!transactionsLoading && stationTransactions.length > 0 && (
                                      <div className="mt-4 flex justify-center">
                                        <Pagination
                                          current={currentPage}
                                          pageSize={pageSize}
                                          total={stationTransactions.length}
                                          onChange={handlePageChange}
                                        />
                                      </div>
                                    )}
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
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  </div>;
};
export default Reports;