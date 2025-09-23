import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, ArrowLeft, Search, User, Battery, Clock, CheckCircle } from "lucide-react";
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
      qrCode: "QR123456789"
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
      qrCode: "QR987654321"
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
      qrCode: "QR555666777"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <History className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Lịch sử giao dịch</h1>
          </div>
          <Link to="/staff">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Search and Filter */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle>Tìm kiếm giao dịch</CardTitle>
            <CardDescription>
              Tìm kiếm và lọc lịch sử giao dịch đổi pin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm theo tên, số điện thoại, mã giao dịch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <div className="space-y-4 animate-slide-up">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="hover-glow">
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-electric-blue mr-2" />
                        <h3 className="font-semibold text-lg">{transaction.customerName}</h3>
                      </div>
                      <Badge variant="secondary">{transaction.status}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>SĐT: {transaction.phone}</p>
                      <p>Mã GD: {transaction.id}</p>
                      <p>QR: {transaction.qrCode}</p>
                    </div>
                  </div>

                  {/* Vehicle & Battery Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Battery className="h-4 w-4 mr-1" />
                      Thông tin xe & pin
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Xe:</span> {transaction.vehicle}</p>
                      <p><span className="text-muted-foreground">Pin:</span> {transaction.batteryType}</p>
                      <p><span className="text-muted-foreground">Trạm:</span> {transaction.stationLocation}</p>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Thời gian
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Xác nhận:</span> {transaction.confirmationTime}</p>
                      <p><span className="text-muted-foreground">Đổi pin:</span> {transaction.swapTime}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Thanh toán</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-success">{transaction.amount} VNĐ</div>
                      <div className="flex items-center text-sm text-success">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Đã thanh toán
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="mt-8 animate-scale-in">
          <CardHeader>
            <CardTitle>Thống kê giao dịch hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <h3 className="text-2xl font-bold text-electric-blue">23</h3>
                <p className="text-muted-foreground">Tổng giao dịch</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-success">21</h3>
                <p className="text-muted-foreground">Hoàn thành</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-warning">2</h3>
                <p className="text-muted-foreground">Đang xử lý</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-charging">3,420,000</h3>
                <p className="text-muted-foreground">Tổng doanh thu (VNĐ)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;