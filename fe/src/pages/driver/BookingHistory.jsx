import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, Car, Battery, CreditCard, X, AlertTriangle, Filter, Search, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, set } from "date-fns";
import { cn } from "@/lib/utils";
import { DatePicker } from 'antd';
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { SystemContext } from "../../contexts/system.context";
import { getBookingHistoryByUserId } from "../../services/axios.services";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import InvoiceDialog from "../../components/InvoiceDialog";
dayjs.extend(customParseFormat);
const BookingHistory = () => {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [dateRange, setDateRange] = useState([null, null]);
  const { RangePicker } = DatePicker;
  const DATE_TIME_FMT = "YYYY-MM-DD";
  const { userData } = useContext(SystemContext);
  const [allBookings, setAllBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadUserHistory = async () => {
    setIsLoading(true);
    try {
      const res = await getBookingHistoryByUserId(userData.userId);
      if (res) {
        setAllBookings(res.data);
      } else if (res?.error) {
        toast.error("Lỗi gọi hiển thị lịch sử", { description: JSON.stringify(res.error) });
      }
    } catch (err) {
      toast.error("Lỗi mạng khi tải lịch sử", { description: String(err?.message ?? err) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserHistory();
  }, [])

  // const allBookings = [
  //   {
  //     id: "BK003",
  //     vehicleType: "VinFast VF6",
  //     batteryType: "Lithium-ion",
  //     bookingTime: "17/01/2024 16:45",
  //     paymentTime: "17/01/2024 16:50",
  //     stationLocation: "Trạm Quận 3 - 456 Lê Văn Sỹ",
  //     bookingMethod: "Thanh toán đầy đủ",
  //     status: "Hoàn thành",
  //     amount: "110,000",
  //     canCancel: false,
  //     batteryInfo: {
  //       code: "BT-3001",
  //       soh: 85,
  //       chargeCycles: 620,
  //       manufactureDate: "05/12/2022",
  //       expiryDate: "05/12/2027",
  //     },
  //   },
  // ];

  // Filter and sort bookings
  const filteredBookings = allBookings.filter((booking) => {
    const matchesSearch =
      `BK${booking?.bookingId}`.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      booking?.stationAddress?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      booking?.vehicleType?.toLowerCase()?.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.bookingStatus === statusFilter;

    // Date filter
    let matchesDate = true;
    const [start, end] = dateRange || [];
    if (start && end) {
      const bookingDate = dayjs(booking.bookingDate, DATE_TIME_FMT);
      if (start && bookingDate.isBefore(start.startOf("day"))) matchesDate = false;
      if (end && bookingDate.isAfter(end.endOf("day"))) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const bookings = filteredBookings;

  const handleCancelBooking = () => {
    toast({
      title: "Yêu cầu hủy đặt chỗ đã được gửi",
      description: "Chúng tôi sẽ xử lý và hoàn tiền trong vòng 24h",
    });
    setCancelDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "default";
      case "CANCELLED":
        return "destructive";
      case "COMPLETED":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">Lịch sử đặt pin</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Tổng đặt chỗ</p>
                  <p className="text-3xl font-bold text-gray-800">{allBookings.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Đã hoàn thành</p>
                  <p className="text-3xl font-bold text-gray-800">{allBookings.filter(b => b.bookingStatus === "COMPLETED").length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Đang chờ</p>
                  <p className="text-3xl font-bold text-gray-800">{allBookings.filter(b => b.bookingStatus === "CONFIRMED").length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Battery className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Đã hủy</p>
                  <p className="text-3xl font-bold text-gray-800">{allBookings.filter(b => b.bookingStatus === "CANCELLED").length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <X className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout with sidebar filter and content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search and Filter Sidebar */}
          <div className="lg:w-80 shrink-0">
            <Card className="border-0 shadow-lg bg-white animate-slide-up sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-4">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  Tìm kiếm & Lọc
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Tìm kiếm đặt chỗ theo mã hoặc trạm
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Tìm kiếm mã đặt chỗ, trạm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Trạng thái</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status" className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CONFIRMED">Đã thanh toán</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* RangePicker của antd */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Khoảng ngày</Label>
                  <RangePicker
                    className="w-full"
                    format="YYYY-MM-DD"
                    value={[
                      dateRange?.[0] ? dayjs(dateRange[0]) : null,
                      dateRange?.[1] ? dayjs(dateRange[1]) : null,
                    ]}
                    onChange={(vals) => setDateRange(vals ?? [null, null])}
                    allowClear
                    placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateRange([null, null]);
                  }}
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200 text-gray-700 transition-all duration-300 hover:scale-105"
                >
                  <X className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Content */}
          <div className="flex-1 min-w-0">
            {/* Bookings List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Danh sách đặt chỗ
                  <span className="text-lg font-normal text-gray-500 ml-2">({bookings.length} kết quả)</span>
                </h2>
              </div>
              <Spin spinning={isLoading} indicator={<LoadingOutlined spin />} tip="Đang tải dữ liệu...">
                {bookings.length === 0 && isLoading === false ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-12 text-center">
                      <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <CalendarIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có đặt chỗ nào</h3>
                      <p className="text-gray-500">Không tìm thấy đặt chỗ nào phù hợp với bộ lọc</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((booking, index) => (
                      <Card key={booking.bookingId} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-foreground">#BK{booking.bookingId}</h3>
                                <Badge
                                  variant={getStatusColor(booking.bookingStatus)}
                                  className="text-xs"
                                >
                                  {booking.bookingStatus === "CONFIRMED" && "Đã thanh toán"}
                                  {booking.bookingStatus === "CANCELLED" && "Đã hủy"}
                                  {booking.bookingStatus === "COMPLETED" && "Hoàn thành"}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {`${booking.bookingDate}  ${booking.timeSlot}`}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {booking.bookingStatus === "CONFIRMED" && (
                                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setSelectedBooking(booking)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Hủy đặt chỗ
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Xác nhận hủy đặt chỗ</DialogTitle>
                                      <DialogDescription>
                                        Bạn có chắc chắn muốn hủy đặt chỗ #{selectedBooking?.bookingId}?
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="text-center p-6">
                                      <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                                      <p className="text-sm mb-2">
                                        <strong>Số tiền:</strong> {selectedBooking?.amount} VNĐ
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        Tiền sẽ được hoàn lại trong vòng 24 giờ
                                      </p>
                                    </div>

                                    <DialogFooter className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => setCancelDialogOpen(false)}
                                        className="flex-1"
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={handleCancelBooking}
                                        className="flex-1"
                                      >
                                        Xác nhận hủy
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {booking.bookingStatus === "CONFIRMED" && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Xem QR
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>QR Code đổi pin</DialogTitle>
                                      <DialogDescription>
                                        Mã QR đã được sử dụng cho giao dịch này
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="text-center p-6">
                                      <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                                        <div className="text-center">
                                          <CreditCard className="h-16 w-16 mx-auto mb-2 text-primary" />
                                          <p className="text-sm font-medium">QR Code #{booking.bookingId}</p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Mã đặt chỗ: {booking.bookingId}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Trạm: {booking.stationAddress}
                                      </p>
                                    </div>

                                    <DialogFooter>
                                      <Button variant="outline" className="w-full">
                                        Đóng
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {
                                booking.bookingStatus === "COMPLETED" && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setInvoiceDialogOpen(true);
                                      }}
                                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Xem hóa đơn
                                    </Button>
                                  </>
                                )
                              }
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Car className="h-3 w-3 mr-1" />
                                Phương tiện
                              </div>
                              <p className="font-medium text-sm">{booking?.vehicleType ?? ""}</p>
                              <p className="text-xs text-muted-foreground">{booking?.batteryType}</p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                Địa điểm
                              </div>
                              <p className="font-medium text-sm">{booking.stationAddress}</p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Số tiền
                              </div>
                              <p className="font-semibold text-sm text-green-600">{booking?.amount?.toLocaleString() ?? ""} VNĐ</p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Battery className="h-3 w-3 mr-1" />
                                Loại pin
                              </div>
                              <p className="font-medium text-sm">{booking.batteryType}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </Spin>
            </div>
            <InvoiceDialog
              open={invoiceDialogOpen}
              onOpenChange={(v) => {
                setInvoiceDialogOpen(v);
                if (!v) setSelectedBooking(null);
              }}
              booking={selectedBooking}
              onDownload={() =>
                toast({
                  title: "Tải hóa đơn thành công",
                  description: "Hóa đơn đã được tải xuống",
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default BookingHistory;
