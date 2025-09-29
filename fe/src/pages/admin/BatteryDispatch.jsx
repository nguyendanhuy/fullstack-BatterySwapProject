import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Battery, ArrowLeft, Search, Plus, ArrowRight, Clock, CheckCircle, AlertCircle, Truck, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
const BatteryDispatch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFromStation, setSelectedFromStation] = useState("");
    const [selectedToStation, setSelectedToStation] = useState("");
    const [batteryCount, setBatteryCount] = useState("");
    const [selectedBatteryType, setSelectedBatteryType] = useState("");
    const [dispatchNote, setDispatchNote] = useState("");
    const [isNewDispatchOpen, setIsNewDispatchOpen] = useState(false);
    const { toast } = useToast();
    const stations = [
        { id: "1", name: "Trạm Quận 1", address: "123 Nguyễn Huệ, Quận 1", availableBatteries: 45 },
        { id: "2", name: "Trạm Bình Thạnh", address: "789 Xô Viết Nghệ Tĩnh, Bình Thạnh", availableBatteries: 38 },
        { id: "3", name: "Trạm Quận 3", address: "456 Lê Văn Sỹ, Quận 3", availableBatteries: 42 },
        { id: "4", name: "Trạm Quận 7", address: "321 Nguyễn Thị Thập, Quận 7", availableBatteries: 15 },
        { id: "5", name: "Kho trung tâm", address: "100 Lê Duẩn, Quận 1", availableBatteries: 150 }
    ];
    const dispatches = [
        {
            id: "1",
            fromStation: "Trạm Quận 1",
            toStation: "Trạm Quận 3",
            batteryCount: 15,
            batteryType: "Pin đầy",
            status: "shipping",
            estimatedTime: "2 giờ",
            createdAt: "10:30 - Hôm nay",
            note: "Cần bổ sung pin đầy cho ca chiều"
        },
        {
            id: "2",
            fromStation: "Trạm Bình Thạnh",
            toStation: "Trạm Quận 1",
            batteryCount: 20,
            batteryType: "Pin hỏng",
            status: "completed",
            estimatedTime: "Hoàn thành",
            createdAt: "09:00 - Hôm nay",
            note: "Chuyển pin hỏng về bảo trì"
        },
        {
            id: "3",
            fromStation: "Kho trung tâm",
            toStation: "Trạm Quận 7",
            batteryCount: 25,
            batteryType: "Pin mới",
            status: "scheduled",
            estimatedTime: "Sáng mai 8:00",
            createdAt: "16:45 - Hôm qua",
            note: "Bổ sung pin mới cho trạm thiếu hụt"
        },
        {
            id: "4",
            fromStation: "Trạm Quận 3",
            toStation: "Kho trung tâm",
            batteryCount: 10,
            batteryType: "Pin cần kiểm tra",
            status: "pending",
            estimatedTime: "Chờ xác nhận",
            createdAt: "14:20 - Hôm nay",
            note: "Pin có dấu hiệu bất thường"
        }
    ];
    const getStatusBadge = (status) => {
        switch (status) {
            case "shipping":
                return <Badge className="bg-warning text-warning-foreground"><Truck className="w-3 h-3 mr-1"/>Đang vận chuyển</Badge>;
            case "completed":
                return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1"/>Hoàn thành</Badge>;
            case "scheduled":
                return <Badge className="bg-electric-blue text-white"><Clock className="w-3 h-3 mr-1"/>Đã lên lịch</Badge>;
            case "pending":
                return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1"/>Chờ xác nhận</Badge>;
            default:
                return <Badge variant="secondary">Không xác định</Badge>;
        }
    };
    const batteryTypes = [
        { value: "full", label: "Pin đầy" },
        { value: "empty", label: "Pin cạn" },
        { value: "new", label: "Pin mới" },
        { value: "damaged", label: "Pin hỏng" },
        { value: "maintenance", label: "Pin cần kiểm tra" }
    ];
    const handleCreateDispatch = () => {
        if (!selectedFromStation || !selectedToStation || !batteryCount || !selectedBatteryType) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng điền đầy đủ thông tin điều phối",
                variant: "destructive"
            });
            return;
        }
        toast({
            title: "Tạo lệnh điều phối thành công",
            description: `Đã tạo lệnh chuyển ${batteryCount} pin từ ${stations.find(s => s.id === selectedFromStation)?.name} đến ${stations.find(s => s.id === selectedToStation)?.name}`,
        });
        // Reset form
        setSelectedFromStation("");
        setSelectedToStation("");
        setBatteryCount("");
        setSelectedBatteryType("");
        setDispatchNote("");
        setIsNewDispatchOpen(false);
    };
    const filteredDispatches = dispatches.filter(dispatch => dispatch.fromStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.toStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.batteryType.toLowerCase().includes(searchTerm.toLowerCase()));
    return (<div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Battery className="h-6 w-6"/>
            </div>
            <div>
              <h1 className="text-xl font-bold">Điều phối pin giữa các trạm</h1>
              <p className="text-blue-100 text-sm">Quản lý phân phối pin tối ưu</p>
            </div>
          </div>
          <Link to="/admin">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2"/>
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Station Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8 animate-fade-in">
          {stations.map((station) => (<Card key={station.id} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                  <MapPin className="h-5 w-5 text-white"/>
                </div>
                <h3 className="font-semibold text-sm">{station.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">{station.availableBatteries}</p>
                <p className="text-xs text-muted-foreground">Pin có sẵn</p>
              </CardContent>
            </Card>))}
        </div>

        {/* AI Heuristic Suggestions */}
        <Card className="mb-8 border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Battery className="h-5 w-5 text-white"/>
              </div>
              Gợi ý điều phối từ thuật toán AI
            </CardTitle>
            <CardDescription>
              Hệ thống AI phân tích và đưa ra các gợi ý điều phối pin tối ưu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-500"/>
                    <span className="font-semibold text-orange-600">Ưu tiên cao</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">Khuyến nghị</Badge>
                </div>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="font-semibold">Trạm Quận 7</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                  <span className="font-semibold">Kho trung tâm</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Chuyển 10 pin hỏng về bảo trì - Trạm đang quá tải pin hỏng
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Độ tin cậy: 92%</span>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    Áp dụng gợi ý
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-500"/>
                    <span className="font-semibold text-blue-600">Ưu tiên trung bình</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">Tối ưu hóa</Badge>
                </div>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="font-semibold">Kho trung tâm</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                  <span className="font-semibold">Trạm Quận 7</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Bổ sung 20 pin đầy - Cân bằng tải giữa các trạm trong khu vực
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Độ tin cậy: 85%</span>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    Áp dụng gợi ý
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-500"/>
                    <span className="font-semibold text-green-600">Ưu tiên thấp</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">Dự phòng</Badge>
                </div>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="font-semibold">Trạm Bình Thạnh</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                  <span className="font-semibold">Trạm Quận 3</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Cân bằng 8 pin đầy - Chuẩn bị cho ca sáng mai
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Độ tin cậy: 78%</span>
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                    Áp dụng gợi ý
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-8 border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Battery className="h-5 w-5 text-white"/>
                  </div>
                  Quản lý điều phối pin
                </CardTitle>
                <CardDescription>Theo dõi và tạo lệnh chuyển pin giữa các trạm</CardDescription>
              </div>
              <Dialog open={isNewDispatchOpen} onOpenChange={setIsNewDispatchOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md">
                    <Plus className="h-4 w-4 mr-2"/>
                    Tạo lệnh điều phối
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Tạo lệnh điều phối pin</DialogTitle>
                    <DialogDescription>
                      Tạo lệnh chuyển pin giữa các trạm
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="fromStation">Trạm gửi</Label>
                      <Select onValueChange={setSelectedFromStation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạm gửi"/>
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) => (<SelectItem key={station.id} value={station.id}>
                              {station.name} ({station.availableBatteries} pin)
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="toStation">Trạm nhận</Label>
                      <Select onValueChange={setSelectedToStation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạm nhận"/>
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) => (<SelectItem key={station.id} value={station.id} disabled={station.id === selectedFromStation}>
                              {station.name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="batteryType">Loại pin</Label>
                      <Select onValueChange={setSelectedBatteryType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại pin"/>
                        </SelectTrigger>
                        <SelectContent>
                          {batteryTypes.map((type) => (<SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="batteryCount">Số lượng pin</Label>
                      <Input id="batteryCount" type="number" placeholder="Nhập số lượng pin" value={batteryCount} onChange={(e) => setBatteryCount(e.target.value)}/>
                    </div>
                    <div>
                      <Label htmlFor="note">Ghi chú</Label>
                      <Textarea id="note" placeholder="Ghi chú về lệnh điều phối..." value={dispatchNote} onChange={(e) => setDispatchNote(e.target.value)}/>
                    </div>
                    <Button onClick={handleCreateDispatch} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      Tạo lệnh điều phối
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input placeholder="Tìm kiếm lệnh điều phối..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full"/>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Search className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch List */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Danh sách lệnh điều phối</CardTitle>
            <CardDescription>
              Tất cả lệnh chuyển pin giữa các trạm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDispatches.map((dispatch) => (<div key={dispatch.id} className="border rounded-lg p-6 hover-glow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-electric-blue">{dispatch.fromStation}</h3>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                      <div className="text-center">
                        <h3 className="font-semibold text-electric-blue">{dispatch.toStation}</h3>
                      </div>
                    </div>
                    {getStatusBadge(dispatch.status)}
                  </div>
                  
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Số lượng</p>
                      <p className="font-semibold">{dispatch.batteryCount} pin</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loại pin</p>
                      <p className="font-semibold">{dispatch.batteryType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Thời gian</p>
                      <p className="font-semibold">{dispatch.estimatedTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tạo lúc</p>
                      <p className="font-semibold">{dispatch.createdAt}</p>
                    </div>
                  </div>
                  
                  {dispatch.note && (<div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm"><strong>Ghi chú:</strong> {dispatch.note}</p>
                    </div>)}
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    {dispatch.status === "pending" && (<>
                        <Button variant="outline" size="sm">
                          Từ chối
                        </Button>
                        <Button size="sm">
                          Xác nhận
                        </Button>
                      </>)}
                    {dispatch.status === "scheduled" && (<Button variant="outline" size="sm">
                        Hủy lịch
                      </Button>)}
                    <Button variant="ghost" size="sm">
                      Chi tiết
                    </Button>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default BatteryDispatch;
