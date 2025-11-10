import { useState, useEffect } from "react";
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
import { getAllRebalance, getAIRebalanceSuggestion, getAllStations, createARebalanceRequest, updateRebalanceRequest } from "../../services/axios.services";
const BatteryDispatch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formRebalance, setFormRebalance] = useState({
    fromStationId: "",
    toStationId: "",
    quantity: "",
    batteryType: "",
    note: ""
  });
  const [isNewDispatchOpen, setIsNewDispatchOpen] = useState(false);
  const [rebalances, setRebalances] = useState([]);
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [stations, setStations] = useState([]);
  const { toast } = useToast();

  const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
  const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);


  const loadRebalances = async () => {
    const rebalances = await getAllRebalance();
    setRebalances(rebalances);
  };

  const loadAISuggestions = async () => {
    const suggestions = await getAIRebalanceSuggestion();
    setAISuggestions(suggestions);
  }

  const loadStations = async () => {
    const stationsData = await getAllStations();
    setStations(stationsData);
  };

  useEffect(() => {
    loadRebalances();
    loadAISuggestions();
    loadStations();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "IN_TRANSIT":
      case "IN_PROGRESS":
      case "shipping":
        return <Badge className="bg-warning text-warning-foreground"><Truck className="w-3 h-3 mr-1" />Đang vận chuyển</Badge>;
      case "COMPLETED":
      case "completed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Hoàn thành</Badge>;
      case "SCHEDULED":
      case "scheduled":
        return <Badge className="bg-electric-blue text-white"><Clock className="w-3 h-3 mr-1" />Đã lên lịch</Badge>;
      case "PENDING":
      case "pending":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Chờ xác nhận</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
  };
  const batteryTypes = [
    { value: "LITHIUM_ION", label: "Pin Lithium-Ion" },
    { value: "LEAD_ACID", label: "Pin Axit" },
    { value: "NICKEL_METAL_HYDRIDE", label: "Pin Nickel-Metal Hydride" },
  ];


  const handleCreateDispatch = async () => {
    if (!formRebalance.fromStationId || !formRebalance.toStationId || !formRebalance.quantity || !formRebalance.batteryType) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin điều phối",
        variant: "destructive"
      });
      return;
    }

    try {
      const fromStation = stations.find(s => s.stationId.toString() === formRebalance.fromStationId);
      const toStation = stations.find(s => s.stationId.toString() === formRebalance.toStationId);

      const requestData = {
        fromStationId: parseInt(formRebalance.fromStationId),
        toStationId: parseInt(formRebalance.toStationId),
        batteryType: formRebalance.batteryType,
        quantity: parseInt(formRebalance.quantity),
        note: formRebalance.note
      };

      await createARebalanceRequest(requestData);

      if (isErrorResponse(requestData)) {
        toast({
          title: "Tạo lệnh điều phối không thành công",
          description: pickApiMessage(requestData),
          variant: "destructive"
        });
      } else {
        toast({
          title: "Tạo lệnh điều phối thành công",
          description: `Đã tạo lệnh chuyển ${formRebalance.quantity} pin từ ${fromStation?.stationName} đến ${toStation?.stationName}`,
        });
      }

      // Reset form
      setFormRebalance({
        fromStationId: "",
        toStationId: "",
        quantity: "",
        batteryType: "",
        note: ""
      });
      setIsNewDispatchOpen(false);

      // Reload danh sách lệnh điều phối
      loadRebalances();
    } catch (error) {
      toast({
        title: "Lỗi tạo lệnh điều phối",
        description: error.response?.data?.message || "Có lỗi xảy ra khi tạo lệnh điều phối",
        variant: "destructive"
      });
    }
  };
  const filteredDispatches = rebalances.filter(dispatch =>
    dispatch.fromStation?.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispatch.toStation?.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispatch.batteryType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispatch.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBatteryTypeLabel = (type) => {
    const typeObj = batteryTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">Ưu tiên cao</Badge>;
      case "MEDIUM":
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">Ưu tiên trung bình</Badge>;
      case "LOW":
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">Ưu tiên thấp</Badge>;
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200";
      case "MEDIUM":
        return "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200";
      case "LOW":
        return "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200";
      default:
        return "bg-gray-50 border border-gray-200";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "MEDIUM":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "LOW":
        return <Clock className="h-5 w-5 text-green-500" />;
      default:
        return <Battery className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleApplySuggestion = (suggestion) => {
    const fromStation = stations.find(s => s.stationName === suggestion.from);
    const toStation = stations.find(s => s.stationName === suggestion.to);

    // Set form với thông tin từ AI suggestion
    setFormRebalance({
      fromStationId: fromStation ? fromStation.stationId.toString() : "",
      toStationId: toStation ? toStation.stationId.toString() : "",
      quantity: suggestion.quantity.toString(),
      batteryType: suggestion.batteryType || "LITHIUM_ION",
      note: suggestion.reason
    });


    // Mở dialog tạo lệnh điều phối
    setIsNewDispatchOpen(true);
  };

  const handleUpdateStatus = async (rebalanceId, newStatus) => {
    try {
      const res = await updateRebalanceRequest(rebalanceId, newStatus);
      console.log("✅Updated status:", res);

      if (isErrorResponse(res)) {
        toast({
          title: "Cập nhật trạng thái không thành công",
          description: pickApiMessage(res),
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cập nhật trạng thái thành công",
          description: `Trạng thái hiện tại: ${res.status}`,
          className: 'bg-green-500 text-white',
        });
      }

      // Reload danh sách
      loadRebalances();
    } catch (error) {
      toast({
        title: "Lỗi cập nhật trạng thái",
        description: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái",
        variant: "destructive"
      });
    }
  };

  return (<div className="min-h-screen bg-background">
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Battery className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Điều phối pin giữa các trạm</h1>
            <p className="text-blue-100 text-sm">Quản lý phân phối pin tối ưu</p>
          </div>
        </div>
        <Link to="/admin">
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
      </div>
    </header>

    <div className="container mx-auto p-6">
      {/* Station Overview */}
      <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            Tổng quan các trạm
          </CardTitle>
          <CardDescription className="text-base">
            Theo dõi số lượng pin có sẵn tại các trạm đổi pin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stations.sort((a, b) => a.stationId - b.stationId).map((station) => (
              <div key={station.stationId} className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-2 py-1 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">#{station.stationId}</span>
                  </div>
                  <Battery className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-semibold text-sm text-gray-800 mb-3 line-clamp-2 min-h-[2.5rem]">
                  {station.stationName}
                </h3>

                {/* Tổng pin */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tổng pin</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {station.availableCount || 0}
                    </p>
                  </div>
                </div>

                {/* Chi tiết pin theo loại */}
                {station.batteries && station.batteries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Chi tiết theo loại:</p>
                    {station.batteries.sort((a, b) => a.batteryType.localeCompare(b.batteryType)).map((battery, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                        <span className="text-gray-600 truncate flex-1" title={getBatteryTypeLabel(battery.batteryType)}>
                          {getBatteryTypeLabel(battery.batteryType).replace('Pin ', '')}
                        </span>
                        <span className="font-bold text-blue-600 ml-2">{battery.available}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
                  <Battery className="h-5 w-5 text-white" />
                </div>
                Quản lý điều phối pin
              </CardTitle>
              <CardDescription>Theo dõi và tạo lệnh chuyển pin giữa các trạm</CardDescription>
            </div>
            <Dialog open={isNewDispatchOpen} onOpenChange={setIsNewDispatchOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
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
                    <Select value={formRebalance.fromStationId} onValueChange={(value) => setFormRebalance({ ...formRebalance, fromStationId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạm gửi" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (<SelectItem key={station.stationId} value={station.stationId.toString()}>
                          #{station.stationId} - {station.stationName} ({station.availableCount || 0} pin)
                        </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="toStation">Trạm nhận</Label>
                    <Select value={formRebalance.toStationId} onValueChange={(value) => setFormRebalance({ ...formRebalance, toStationId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạm nhận" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (<SelectItem key={station.stationId} value={station.stationId.toString()} disabled={station.stationId.toString() === formRebalance.fromStationId}>
                          #{station.stationId} - {station.stationName} ({station.availableCount || 0} pin)
                        </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="batteryType">Loại pin</Label>
                    <Select value={formRebalance.batteryType} onValueChange={(value) => setFormRebalance({ ...formRebalance, batteryType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại pin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LITHIUM_ION">Pin Lithium-Ion</SelectItem>
                        <SelectItem value="LEAD_ACID">Pin Axit</SelectItem>
                        <SelectItem value="NICKEL_METAL_HYDRIDE">Pin Nickel-Metal Hydride</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="batteryCount">Số lượng pin</Label>
                    <Input id="batteryCount" type="number" placeholder="Nhập số lượng pin" value={formRebalance.quantity} onChange={(e) => setFormRebalance({ ...formRebalance, quantity: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="note">Ghi chú</Label>
                    <Textarea id="note" placeholder="Ghi chú về lệnh điều phối..." value={formRebalance.note} onChange={(e) => setFormRebalance({ ...formRebalance, note: e.target.value })} />
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
              <Input placeholder="Tìm kiếm lệnh điều phối theo tên trạm, loại pin, ghi chú..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              <Search className="h-4 w-4" />
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
            {filteredDispatches.sort((a, b) => b.id - a.id).map((dispatch) => (<div key={dispatch.id} className="border rounded-lg p-6 hover-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1 rounded-lg">
                    <p className="text-white font-bold text-sm">Lệnh #{dispatch.id}</p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-electric-blue">Trạm #{dispatch.fromStation?.stationId} | {dispatch.fromStation?.stationName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{dispatch.fromStation?.address}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-semibold text-electric-blue">Trạm #{dispatch.toStation?.stationId} | {dispatch.toStation?.stationName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{dispatch.toStation?.address}</p>
                  </div>
                </div>
                {getStatusBadge(dispatch.status)}
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-semibold">{dispatch.quantity} pin</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại pin</p>
                  <p className="font-semibold">{getBatteryTypeLabel(dispatch.batteryType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Select
                    value={dispatch.status}
                    onValueChange={(newStatus) => handleUpdateStatus(dispatch.id, newStatus)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                      <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                      <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tạo lúc</p>
                  <p className="font-semibold">{new Date(dispatch.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {dispatch.note && (<div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm"><strong>Ghi chú:</strong> {dispatch.note}</p>
              </div>)}
            </div>))}

            {filteredDispatches.length === 0 && (
              <div className="text-center py-12">
                <Battery className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có lệnh điều phối nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Heuristic Suggestions */}
      <Card className="mb-8 border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
              <Battery className="h-5 w-5 text-white" />
            </div>
            Gợi ý điều phối từ thuật toán AI
          </CardTitle>
          <CardDescription>
            Hệ thống AI phân tích và đưa ra các gợi ý điều phối pin tối ưu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((suggestion, index) => (
                <div key={index} className={`${getPriorityStyle(suggestion.priority)} rounded-lg p-4 hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(suggestion.priority)}
                      <span className="font-semibold text-sm">{suggestion.priority}</span>
                    </div>
                    {getPriorityBadge(suggestion.priority)}
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="font-semibold text-sm">{suggestion.from}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{suggestion.to}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Số lượng: <strong>{suggestion.quantity} pin</strong> - {suggestion.reason}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Độ tin cậy: {suggestion.confidence}%</span>
                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      Áp dụng gợi ý
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Battery className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có gợi ý AI nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>);
};
export default BatteryDispatch;
