import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, Car, Battery, CreditCard, X, Home, AlertTriangle, Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import batteryIcon from "@/assets/battery-icon.jpg";

const BookingHistory = () => {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelDepositDialogOpen, setCancelDepositDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [bankInfo, setBankInfo] = useState({
    accountNumber: "",
    bankName: "",
    accountHolder: "",
    reason: ""
  });

  const allBookings = [
    {
      id: "BK004",
      vehicleType: "VinFast VF8",
      batteryType: "Lithium-ion",
      bookingTime: "18/01/2024 10:15",
      paymentTime: "18/01/2024 10:20",
      stationLocation: "Trạm Quận 7 - 999 Nguyễn Văn Linh",
      bookingMethod: "Đặt cọc",
      status: "Đã cọc",
      amount: "50,000",
      canCancel: true,
      batteryInfo: {
        code: "BT-4001",
        soh: 92,
        chargeCycles: 450,
        manufactureDate: "10/03/2023",
        expiryDate: "10/03/2028"
      }
    },
    {
      id: "BK003",
      vehicleType: "VinFast VF6",
      batteryType: "Lithium-ion", 
      bookingTime: "17/01/2024 16:45",
      paymentTime: "17/01/2024 16:50",
      stationLocation: "Trạm Quận 3 - 456 Lê Văn Sỹ",
      bookingMethod: "Thanh toán đầy đủ",
      status: "Đã thanh toán",
      amount: "110,000",
      canCancel: false,
      batteryInfo: {
        code: "BT-3001",
        soh: 85,
        chargeCycles: 620,
        manufactureDate: "05/12/2022",
        expiryDate: "05/12/2027"
      }
    },
    {
      id: "BK002", 
      vehicleType: "VinFast VF9",
      batteryType: "LFP",
      bookingTime: "16/01/2024 09:15",
      paymentTime: "16/01/2024 09:20",
      stationLocation: "Trạm Bình Thạnh - 789 Xô Viết Nghệ Tĩnh",
      bookingMethod: "Thanh toán đầy đủ",
      status: "Đã thanh toán",
      amount: "120,000",
      canCancel: false,
      batteryInfo: {
        code: "BT-2001",
        soh: 95,
        chargeCycles: 320,
        manufactureDate: "15/08/2023",
        expiryDate: "15/08/2028"
      }
    },
    {
      id: "BK001",
      vehicleType: "VinFast VF8",
      batteryType: "Lithium-ion",
      bookingTime: "15/01/2024 14:30",
      paymentTime: "15/01/2024 14:35",
      stationLocation: "Trạm Quận 1 - 123 Nguyễn Huệ",
      bookingMethod: "Thanh toán đầy đủ",
      status: "Hoàn thành",
      amount: "120,000",
      canCancel: false,
      batteryInfo: {
        code: "BT-1001",
        soh: 88,
        chargeCycles: 580,
        manufactureDate: "20/05/2022",
        expiryDate: "20/05/2027"
      }
    }
  ];

  // Filter and sort bookings
  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.stationLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesMethod = methodFilter === "all" || booking.bookingMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const bookings = filteredBookings;

  const handleCancelBooking = () => {
    if (!bankInfo.accountNumber || !bankInfo.bankName || !bankInfo.accountHolder) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin ngân hàng",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Yêu cầu hủy cọc đã được gửi",
      description: "Chúng tôi sẽ xử lý và hoàn tiền trong vòng 24h",
    });
    
    setCancelDialogOpen(false);
    setBankInfo({ accountNumber: "", bankName: "", accountHolder: "", reason: "" });
  };

  const handleCancelDeposit = () => {
    toast({
      title: "Yêu cầu hủy cọc đã được gửi",
      description: "Chúng tôi sẽ xử lý và hoàn tiền trong vòng 24h",
    });
    setCancelDepositDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Hoàn thành": return "default";
      case "Đã cọc": return "secondary";
      case "Đã thanh toán": return "outline";
      default: return "default";
    }
  };

  const getMethodColor = (method) => {
    return method === "Đặt cọc" ? "destructive" : "default";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Lịch sử đặt chỗ</h1>
          </div>
          <div className="flex space-x-2">
            <Link to="/driver">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
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
        {/* Hero Section */}
        <div className="relative mb-8 rounded-xl overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/20 to-charging/20" />
          <img 
            src={batteryIcon}
            alt="Battery Management" 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-xl font-bold mb-1">Quản lý lịch sử đặt chỗ</h2>
            <p className="text-white/80">Theo dõi và quản lý các đơn đặt chỗ của bạn</p>
          </div>
        </div>

        {/* Booking Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{bookings.length}</h3>
              <p className="text-muted-foreground">Tổng đặt chỗ</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{bookings.filter(b => !b.canCancel).length}</h3>
              <p className="text-muted-foreground">Hoàn thành</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Battery className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{bookings.filter(b => b.canCancel).length}</h3>
              <p className="text-muted-foreground">Đang cọc</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <Card className="mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Mã đặt chỗ, trạm, xe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                    <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
                    <SelectItem value="Đã cọc">Đã cọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phương thức</Label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Thanh toán đầy đủ">Thanh toán đầy đủ</SelectItem>
                    <SelectItem value="Đặt cọc">Đặt cọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setMethodFilter("all");
                  }}
                  className="w-full"
                >
                  Xóa lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Danh sách đặt chỗ ({bookings.length} kết quả)</CardTitle>
            <CardDescription>
              Chi tiết các lần đặt chỗ đổi pin của bạn (sắp xếp theo thời gian mới nhất)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-6 hover-glow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-electric-blue">#{booking.id}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                        <Badge variant={getMethodColor(booking.bookingMethod)}>{booking.bookingMethod}</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {booking.canCancel && booking.status === "Đã cọc" && (
                        <Dialog open={cancelDepositDialogOpen} onOpenChange={setCancelDepositDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Hủy lịch
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Xác nhận hủy lịch</DialogTitle>
                              <DialogDescription>
                                Bạn có chắc chắn muốn hủy lịch cho đặt chỗ #{selectedBooking?.id}?
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="text-center p-6">
                              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-warning" />
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
                                onClick={() => setCancelDepositDialogOpen(false)}
                                className="flex-1"
                              >
                                Hủy
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleCancelDeposit}
                                className="flex-1"
                              >
                                Xác nhận hủy lịch
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {booking.status === "Đã thanh toán" && (
                        <Dialog open={cancelDepositDialogOpen} onOpenChange={setCancelDepositDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Hủy lịch
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Xác nhận hủy lịch</DialogTitle>
                              <DialogDescription>
                                Bạn có chắc chắn muốn hủy lịch cho đặt chỗ #{selectedBooking?.id}?
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="text-center p-6">
                              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-warning" />
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
                                onClick={() => setCancelDepositDialogOpen(false)}
                                className="flex-1"
                              >
                                Hủy
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleCancelDeposit}
                                className="flex-1"
                              >
                                Xác nhận hủy lịch
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {!booking.canCancel && booking.status !== "Đã cọc" && booking.status !== "Đã thanh toán" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Xem QR
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>QR Code đổi pin</DialogTitle>
                              <DialogDescription>
                                Xuất trình QR này cho nhân viên tại trạm để đổi pin
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="text-center p-6">
                              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-center">
                                  <CreditCard className="h-16 w-16 mx-auto mb-2 text-electric-blue" />
                                  <p className="text-sm font-medium">QR Code #{booking.id}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Mã đặt chỗ: {booking.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Trạm: {booking.stationLocation}
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
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Car className="h-4 w-4 mr-1" />
                        Loại xe & pin
                      </div>
                      <p className="font-medium">{booking.vehicleType}</p>
                      <p className="text-sm text-muted-foreground">{booking.batteryType}</p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Thời gian đặt
                      </div>
                      <p className="font-medium">{booking.bookingTime}</p>
                      <p className="text-sm text-muted-foreground">TT: {booking.paymentTime}</p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        Địa điểm
                      </div>
                      <p className="font-medium">{booking.stationLocation}</p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Thanh toán
                      </div>
                      <p className="font-medium text-success">{booking.amount.toLocaleString()} VNĐ</p>
                    </div>
                  </div>

                  {/* Battery Information */}
                  <div className="border-t pt-4">
                    <h4 className="flex items-center text-sm font-medium text-muted-foreground mb-3">
                      <Battery className="h-4 w-4 mr-1" />
                      Thông tin chi tiết pin
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Mã pin</p>
                        <p className="font-medium text-sm">{booking.batteryInfo?.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SoH</p>
                        <p className="font-medium text-sm">
                          <span className={`${booking.batteryInfo?.soh >= 90 ? 'text-success' : booking.batteryInfo?.soh >= 70 ? 'text-warning' : 'text-destructive'}`}>
                            {booking.batteryInfo?.soh}%
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chu kỳ sạc/xả</p>
                        <p className="font-medium text-sm">{booking.batteryInfo?.chargeCycles} lần</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày sản xuất</p>
                        <p className="font-medium text-sm">{booking.batteryInfo?.manufactureDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Hạn sử dụng</p>
                        <p className="font-medium text-sm">{booking.batteryInfo?.expiryDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingHistory;