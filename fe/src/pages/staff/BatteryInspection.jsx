import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, AlertTriangle, CheckCircle, Wrench, Clock, User, Battery, Zap, Activity, TrendingUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to determine SOH color based on value
const getSohColor = (soh) => {
  const sohValue = parseInt(soh);
  if (sohValue > 90) return "text-green-600";
  if (sohValue > 80) return "text-orange-500";
  return "text-red-500";
};

// Helper function to get status-based styles
const getStatusStyles = (status) => {
  const isQualified = status === "Đạt chuẩn";
  return {
    bgGradient: isQualified
      ? "bg-gradient-to-br from-green-500 to-emerald-500"
      : "bg-gradient-to-br from-red-500 to-orange-500",
    badgeGradient: isQualified
      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600",
    icon: isQualified ? CheckCircle : Wrench
  };
};

const BatteryInspection = () => {
  const { toast } = useToast();
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const emptyBatteries = [
    {
      id: "BAT005",
      type: "Lithium-ion",
      lastUsed: "14/12/2024 16:30",
      location: "Slot A3",
      soh: "78%",
      cycles: 345
    },
    {
      id: "BAT009",
      type: "Pin LFP",
      lastUsed: "14/12/2024 15:20",
      location: "Slot B3",
      soh: "75%",
      cycles: 389
    },
    {
      id: "BAT014",
      type: "Lithium-ion",
      lastUsed: "14/12/2024 14:10",
      location: "Slot C2",
      soh: "72%",
      cycles: 467
    }
  ];

  const inspectionHistory = [
    {
      id: "BAT001",
      type: "Lithium-ion",
      inspectionDate: "14/12/2024 10:30",
      inspector: "Nguyễn Văn A",
      physicalCondition: "Tốt",
      notes: "Pin trong tình trạng bình thường",
      status: "Đạt chuẩn"
    },
    {
      id: "BAT003",
      type: "Pin LFP",
      inspectionDate: "14/12/2024 09:15",
      inspector: "Trần Thị B",
      physicalCondition: "Có dấu hiệu ăn mòn nhẹ",
      notes: "Cần theo dõi thêm",
      status: "Bảo trì"
    },
    {
      id: "BAT007",
      type: "Lithium-ion",
      inspectionDate: "13/12/2024 16:45",
      inspector: "Nguyễn Văn A",
      physicalCondition: "Tốt",
      notes: "Pin hoạt động ổn định",
      status: "Đạt chuẩn"
    }
  ];

  const fullInspectionHistory = [
    ...inspectionHistory,
    {
      id: "BAT010",
      type: "Pin LFP",
      inspectionDate: "13/12/2024 14:20",
      inspector: "Trần Thị B",
      physicalCondition: "Tốt",
      notes: "Pin trong tình trạng tốt",
      status: "Đạt chuẩn"
    },
    {
      id: "BAT012",
      type: "Lithium-ion",
      inspectionDate: "13/12/2024 11:30",
      inspector: "Nguyễn Văn A",
      physicalCondition: "Có vết xước nhẹ",
      notes: "Vết xước không ảnh hưởng đến hoạt động",
      status: "Đạt chuẩn"
    },
    {
      id: "BAT008",
      type: "Pin LFP",
      inspectionDate: "12/12/2024 15:45",
      inspector: "Trần Thị B",
      physicalCondition: "Hư hại nặng",
      notes: "Pin bị phồng, cần thay thế",
      status: "Bảo trì"
    },
    {
      id: "BAT015",
      type: "Lithium-ion",
      inspectionDate: "12/12/2024 13:10",
      inspector: "Nguyễn Văn A",
      physicalCondition: "Tốt",
      notes: "Pin hoạt động bình thường",
      status: "Đạt chuẩn"
    },
    {
      id: "BAT002",
      type: "Pin LFP",
      inspectionDate: "12/12/2024 09:30",
      inspector: "Trần Thị B",
      physicalCondition: "Tốt",
      notes: "Pin trong tình trạng tốt",
      status: "Đạt chuẩn"
    },
    {
      id: "BAT006",
      type: "Lithium-ion",
      inspectionDate: "11/12/2024 16:20",
      inspector: "Nguyễn Văn A",
      physicalCondition: "Có dấu hiệu ăn mòn",
      notes: "Cần theo dõi và bảo trì định kỳ",
      status: "Bảo trì"
    },
    {
      id: "BAT011",
      type: "Pin LFP",
      inspectionDate: "11/12/2024 14:15",
      inspector: "Trần Thị B",
      physicalCondition: "Tốt",
      notes: "Pin hoạt động ổn định",
      status: "Đạt chuẩn"
    }
  ];

  const displayedHistory = showFullHistory ? fullInspectionHistory : inspectionHistory;

  const staffList = ["Nguyễn Văn A", "Trần Thị B"];

  const InspectionForm = ({ battery, onClose }) => {
    const [physicalCondition, setPhysicalCondition] = useState("");
    const [notes, setNotes] = useState("");
    const [inspector, setInspector] = useState("");

    const handleSubmit = () => {
      toast({
        title: "Kiểm tra pin thành công",
        description: `Pin ${battery.id} đã được kiểm tra bởi ${inspector}`,
      });
      onClose();
    };

    const handleSendMaintenance = () => {
      toast({
        title: "Gửi pin bảo trì thành công",
        description: `Pin ${battery.id} đã được chuyển sang trạng thái bảo trì`,
      });
      onClose();
    };

    const isSubmitDisabled = !physicalCondition || !notes || !inspector;
    const isMaintenanceDisabled = !inspector;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-2 border-blue-200 dark:border-blue-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mr-3">
              <Battery className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Thông tin pin: {battery.id}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white/60 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-muted-foreground text-xs block mb-1">Loại pin</span>
              <p className="font-semibold text-foreground">{battery.type}</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-muted-foreground text-xs block mb-1">State of Health</span>
              <p className={`font-bold text-lg ${getSohColor(battery.soh)}`}>
                {battery.soh}
              </p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-muted-foreground text-xs block mb-1">Chu kỳ sử dụng</span>
              <p className="font-semibold text-foreground">{battery.cycles} lần</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-muted-foreground text-xs block mb-1">Vị trí</span>
              <p className="font-semibold text-foreground">{battery.location}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="physical" className="text-sm font-semibold flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              Tình trạng vật lý
            </Label>
            <Textarea
              id="physical"
              placeholder="Mô tả chi tiết tình trạng vật lý của pin (vết xước, ăn mòn, biến dạng...)..."
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
              className="min-h-[100px] border-2 focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
              Ghi chú đánh giá
            </Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú bổ sung về hiệu suất, khuyến nghị bảo trì..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] border-2 focus:border-purple-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <User className="h-4 w-4 mr-2 text-indigo-600" />
              Người thực hiện kiểm tra
            </Label>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger className="border-2 focus:border-indigo-400">
                <SelectValue placeholder="Chọn nhân viên kiểm tra" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff} value={staff}>
                    {staff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Hoàn thành kiểm tra
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={handleSendMaintenance}
            disabled={isMaintenanceDisabled}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Gửi bảo trì
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Animated Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center mb-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl mr-4 shadow-lg animate-pulse">
            <Search className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
              Kiểm tra & Giám định pin
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Đánh giá chất lượng và hiệu suất pin điện</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-orange-600 to-yellow-600 bg-clip-text text-transparent">3</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-white">Cần kiểm tra</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pin chờ đánh giá</p>
            </div>
            <div className="mt-3 flex items-center text-xs text-orange-600 dark:text-orange-400 font-semibold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Ưu tiên cao
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in group overflow-hidden relative" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent">2</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-white">Gửi bảo trì</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cần sửa chữa</p>
            </div>
            <div className="mt-3 flex items-center text-xs text-red-600 dark:text-red-400 font-semibold">
              <Activity className="h-3 w-3 mr-1" />
              Khẩn cấp
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in group overflow-hidden relative" style={{ animationDelay: "0.2s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">8</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-white">Đạt chuẩn</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hoạt động tốt</p>
            </div>
            <div className="mt-3 flex items-center text-xs text-green-600 dark:text-green-400 font-semibold">
              <Zap className="h-3 w-3 mr-1" />
              Xuất sắc
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Batteries Requiring Inspection */}
      <Card className="mb-8 border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 animate-fade-in hover:shadow-3xl transition-all duration-500 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl"></div>
        <CardHeader className="relative z-10 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 text-white pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4 shadow-lg">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Pin cần kiểm tra ngay</CardTitle>
                <CardDescription className="text-orange-100 mt-1">
                  Danh sách pin yêu cầu giám định chất lượng
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm backdrop-blur-sm">
              {emptyBatteries.length} pin
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <div className="space-y-4">
            {emptyBatteries.map((battery, index) => (
              <Card
                key={battery.id}
                className="border-2 border-orange-200 dark:border-orange-800 shadow-lg bg-white dark:bg-slate-800 hover:shadow-2xl hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300 hover:scale-[1.02] animate-fade-in group overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-900/10 dark:to-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-5 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Battery className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{battery.id}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{battery.type}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vị trí</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{battery.location}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">State of Health</p>
                      <div className="flex items-center space-x-2">
                        <Activity className={`h-4 w-4 ${getSohColor(battery.soh)}`} />
                        <p className={`font-black text-lg ${getSohColor(battery.soh)}`}>
                          {battery.soh}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chu kỳ</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{battery.cycles} lần</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lần cuối dùng</p>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-600 dark:text-gray-400" />
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{battery.lastUsed}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedBattery(battery)}
                            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white rounded-xl px-6 py-3 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-2xl font-bold"
                          >
                            <Search className="h-5 w-5 mr-2" />
                            Kiểm tra ngay
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
                          <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              Kiểm tra pin {battery.id}
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">
                              Thực hiện giám định và đánh giá chất lượng pin
                            </DialogDescription>
                          </DialogHeader>
                          {selectedBattery && (
                            <InspectionForm
                              battery={selectedBattery}
                              onClose={() => setSelectedBattery(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Inspection History */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 animate-fade-in hover:shadow-3xl transition-all duration-500 overflow-hidden" style={{ animationDelay: "0.3s" }}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        <CardHeader className="relative z-10 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4 shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Lịch sử kiểm tra pin</CardTitle>
                <CardDescription className="text-blue-100 mt-1">
                  {showFullHistory ? "Tổng hợp tất cả pin đã kiểm tra" : "Pin đã được kiểm tra gần đây"}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
            >
              {showFullHistory ? "Thu gọn" : "Xem tất cả"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <div className="space-y-4">
            {displayedHistory.map((record, index) => (
              <Card
                key={record.id}
                className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-white dark:bg-slate-800 hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:scale-[1.01] animate-fade-in group overflow-hidden relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-5 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${getStatusStyles(record.status).bgGradient}`}>
                        {(() => {
                          const Icon = getStatusStyles(record.status).icon;
                          return <Icon className="h-6 w-6 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{record.id}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{record.type}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Thời gian
                      </div>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{record.inspectionDate}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <User className="h-3 w-3 mr-1" />
                        Người kiểm tra
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{record.inspector}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg col-span-1 md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tình trạng vật lý</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{record.physicalCondition}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{record.notes}</p>
                    </div>

                    <div className="flex justify-end">
                      <Badge className={`${getStatusStyles(record.status).badgeGradient} text-white border-0 px-4 py-2 text-sm font-bold shadow-lg hover:scale-110 transition-all duration-300`}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatteryInspection;
