import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, AlertTriangle, CheckCircle, Wrench, Clock, User, Battery, Zap, Activity, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getWattingBatteryInventory,
  batteryStatusUpdate,
  createInspection,
  getInspectionByStaffId,
} from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const BatteryInspection = () => {
  const { toast } = useToast();
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [waitingBatteries, setWaitingBatteries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [staffInspections, setStaffInspections] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const { userData } = useContext(SystemContext);
  const STATION_ID = userData?.assignedStationId;
  const USER_ID = userData?.userId;
  const maintenanceCount = staffInspections.filter(r => r.status === "Bảo trì").length;
  const passCount = staffInspections.filter(r => r.status === "Đạt chuẩn").length;
  // Helpers cho toast từ BE
  const isErrorResponse = (res) =>
    res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);
  const pickApiMessage = (res) =>
    res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";

  // ---------- Fetch danh sách pin chờ ----------
  const getWaitingBatteries = async () => {
    try {
      setLoading(true);
      const response = await getWattingBatteryInventory(STATION_ID);
      if (response) {
        setWaitingBatteries(response);
      } else {
        toast({
          title: "Không tải được danh sách pin chờ",
          description: "Vui lòng thử lại sau",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi tải danh sách",
        description: err?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch lịch sử kiểm tra theo staff ----------
  const fetchStaffInspections = async () => {
    try {
      setLoadingHistory(true);
      const res = await getInspectionByStaffId(USER_ID);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const mapped = list
        .map((it) => ({
          id: it.id,
          batteryId: it.batteryId,
          inspectionDate: format(new Date(it.inspectionTime), "dd/MM/yyyy HH:mm", { locale: vi }),
          inspector: userData?.fullName || "Bạn",
          physicalCondition: it.physicalNotes || "—",
          soh: it.stateOfHealth,
          damaged: !!it.damaged,
          status: it.status === "PASS" ? "Đạt chuẩn" : "Bảo trì",
        }))
        .sort((a, b) => {
          // So sánh theo thời gian gốc sẽ chuẩn hơn, nhưng hiện đã stringify — vẫn ổn cho UI
          // Nếu muốn chuẩn: giữ thêm inspectionTime gốc (Date) và sort theo Date.
          return b.inspectionDate.localeCompare(a.inspectionDate);
        });

      setStaffInspections(mapped);
    } catch (err) {
      toast({
        title: "Lỗi tải lịch sử",
        description: err?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    getWaitingBatteries();
    fetchStaffInspections();
  }, []);

  // ---------- Form kiểm tra ----------
  const InspectionForm = ({ battery, onClose, bookingId, onSuccess }) => {
    const [physicalCondition, setPhysicalCondition] = useState("");
    const [soh, setSoh] = useState("");
    const [status, setStatus] = useState(""); // AVAILABLE | MAINTENANCE
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const mapStatusToInspection = (s) => (s === "MAINTENANCE" ? "IN_MAINTENANCE" : "PASS");

    const handleSubmit = async () => {
      const sohNum = Number(soh);
      if (Number.isNaN(sohNum) || sohNum < 0 || sohNum > 100) {
        toast({
          title: "SoH không hợp lệ",
          description: "Vui lòng nhập từ 0 đến 100.",
          variant: "destructive",
        });
        return;
      }
      if (!status) {
        toast({
          title: "Chưa chọn trạng thái",
          description: "Hãy chọn Tiếp tục sử dụng hoặc Gửi bảo trì.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      try {
        // 1) Cập nhật trạng thái pin
        await batteryStatusUpdate(battery.id, status);

        // 2) Tạo phiếu inspection
        const payload = {
          batteryInId: battery.id,
          bookingId: Number(bookingId || 0),
          stateOfHealth: sohNum,
          physicalNotes: physicalCondition?.trim() || "",
          status: mapStatusToInspection(status), // PASS | IN_MAINTENANCE
          staffId: String(USER_ID || ""),
        };

        const res = await createInspection(payload);
        if (res?.success) {
          toast({
            title: "Đã lưu kiểm tra pin",
            description: `Pin ${battery.id}: ${status === "MAINTENANCE" ? "Gửi bảo trì" : "Tiếp tục sử dụng"
              } • SoH ${sohNum}%`,
            duration: 5000,
          });
        } else if (isErrorResponse(res)) {
          toast({
            title: "Lỗi khi tạo Inspection",
            description: pickApiMessage(res),
            variant: "destructive",
          });
        }

        // refresh list + lịch sử + đóng form
        await onSuccess?.();
        onClose();
      } catch (err) {
        toast({
          title: "Lỗi khi lưu kiểm tra",
          description: err?.response?.data?.message || err?.message || "Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* Thông tin pin */}
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
              <span className="text-muted-foreground text-xs block mb-1">Chu kỳ sử dụng</span>
              <p className="font-semibold text-foreground">{battery.cycles} lần</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-muted-foreground text-xs block mb-1">Vị trí</span>
              <p className="font-semibold text-foreground">{battery.location}</p>
            </div>
          </div>
        </div>

        {/* Nhập dữ liệu kiểm tra */}
        <div className="space-y-4">
          {/* SoH */}
          <div className="space-y-2">
            <Label htmlFor="soh" className="text-sm font-semibold flex items-center">
              <Activity className="h-4 w-4 mr-2 text-purple-600" />
              Chỉ số SoH (%)
            </Label>
            <input
              id="soh"
              type="number"
              min="0"
              max="100"
              value={soh}
              onChange={(e) => setSoh(e.target.value)}
              placeholder="Nhập giá trị SoH (0 - 100)"
              className="w-full border-2 rounded-lg px-3 py-2 focus:border-purple-400 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              * SoH thể hiện tình trạng sức khỏe của pin. Giá trị ≥ 80% được xem là đạt chuẩn.
            </p>
          </div>

          {/* Tình trạng vật lý */}
          <div className="space-y-2">
            <Label htmlFor="physical" className="text-sm font-semibold flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-600" /> Tình trạng vật lý
            </Label>
            <Textarea
              id="physical"
              placeholder="Mô tả chi tiết tình trạng vật lý của pin (vết xước, ăn mòn, biến dạng...)..."
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
              className="min-h-[100px] border-2 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Chọn trạng thái pin */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <Zap className="h-4 w-4 mr-2 text-amber-600" />
              Trạng thái pin
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="border-2 focus:border-amber-400">
                <SelectValue placeholder="Chọn trạng thái xử lý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Tiếp tục sử dụng</SelectItem>
                <SelectItem value="MAINTENANCE">Gửi bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting || !physicalCondition || !soh || !status}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Hoàn thành kiểm tra
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300 transition-all duration-300"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
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

      {/* Stats (giữ nguyên demo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-orange-600 to-yellow-600 bg-clip-text text-transparent">{waitingBatteries.length}</h3>
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
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent">{maintenanceCount}</h3>
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
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{passCount}</h3>
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

      {/* Danh sách pin cần kiểm tra */}
      <Card className="mb-8 border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 animate-fade-in hover:shadow-3xl transition-all duration-500 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl" />
        <CardHeader className="relative z-10 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 text-white pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4 shadow-lg">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Pin cần kiểm tra ngay</CardTitle>
                <CardDescription className="text-orange-100 mt-1">Danh sách pin yêu cầu giám định chất lượng</CardDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm backdrop-blur-sm">
              {waitingBatteries.length} pin
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 relative z-10">
          {loading ? (
            <div className="py-10 flex items-center justify-center text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải danh sách pin...
            </div>
          ) : (
            <div className="space-y-4">
              {waitingBatteries.map((battery, index) => (
                <Card
                  key={battery.batteryId}
                  className="border-2 border-orange-200 dark:border-orange-800 shadow-lg bg-white dark:bg-slate-800 hover:shadow-2xl hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300 hover:scale-[1.02] animate-fade-in group overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-900/10 dark:to-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-5 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="flex items-center space-x-3 md:col-span-2">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-md">
                          <Battery className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">{battery.batteryId}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {String(battery.batteryType || "").replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vị trí</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {`${battery.dockName || ""}${battery.slotNumber ?? ""}`}
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chu kỳ</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {(battery.cycleCount ?? 0)} lần
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking gần nhất</p>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-600 dark:text-gray-400" />
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{battery.lastBookingId || "—"}</p>
                        </div>
                      </div>

                      {/* Nút kiểm tra ở cột phải */}
                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          onClick={() => {
                            setSelectedBattery({
                              id: battery.batteryId,
                              type: String(battery.batteryType || "").replaceAll("_", " "),
                              cycles: battery.cycleCount ?? 0,
                              location: `${battery.dockName || ""}${battery.slotNumber ?? ""}`,
                              _bookingId: battery.lastBookingId || 0,
                            });
                            setOpenDialog(true);
                          }}
                          className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                          <Search className="h-5 w-5 mr-2" />
                          Kiểm tra ngay
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog kiểm tra pin (controlled) */}
      <Dialog
        open={openDialog}
        onOpenChange={(v) => {
          setOpenDialog(v);
          if (!v) setSelectedBattery(null);
        }}
      >
        {openDialog && selectedBattery && (
          <DialogContent className="max-w-2xl border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Kiểm tra pin {selectedBattery.id}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Thực hiện giám định và đánh giá chất lượng pin cho booking {selectedBattery._bookingId || "—"}
              </DialogDescription>
            </DialogHeader>

            <InspectionForm
              battery={selectedBattery}
              bookingId={selectedBattery._bookingId}
              onClose={() => setOpenDialog(false)}
              onSuccess={async () => {
                await Promise.all([fetchStaffInspections(), getWaitingBatteries()]);
              }}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Lịch sử kiểm tra pin (data thật theo staff) */}
      <Card
        className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 animate-fade-in hover:shadow-3xl transition-all duration-500 overflow-hidden"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
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
          {loadingHistory ? (
            <div className="py-10 flex items-center justify-center text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải lịch sử kiểm tra...
            </div>
          ) : (
            <div className="space-y-4">
              {(showFullHistory ? staffInspections : staffInspections.slice(0, 8)).map((record, index) => (
                <Card
                  key={record.id}
                  className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-white dark:bg-slate-800 hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:scale-[1.01] animate-fade-in group overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-5 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      {/* Pin + trạng thái icon */}
                      <div className="flex items-center space-x-3 md:col-span-2">
                        <div
                          className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${record.status === "Đạt chuẩn"
                            ? "bg-gradient-to-br from-green-500 to-emerald-500"
                            : "bg-gradient-to-br from-red-500 to-orange-500"
                            }`}
                        >
                          {record.status === "Đạt chuẩn" ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                          ) : (
                            <Wrench className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">{record.batteryId}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            SoH: <span className="font-semibold">{record.soh}%</span>
                            {" • "}
                            Hư hại: <span className="font-semibold">{record.damaged ? "Có" : "Không"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Thời gian */}
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Thời gian
                        </div>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{record.inspectionDate}</p>
                      </div>

                      {/* Người kiểm tra */}
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <User className="h-3 w-3 mr-1" />
                          Người kiểm tra
                        </div>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{record.inspector}</p>
                      </div>

                      {/* Ghi chú */}
                      <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ghi chú</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{record.physicalCondition}</p>
                      </div>

                      {/* Badge trạng thái */}
                      <div className="flex justify-end">
                        <Badge
                          className={`${record.status === "Đạt chuẩn"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                            } text-white border-0 px-4 py-2 text-sm font-bold shadow-lg hover:scale-110 transition-all duration-300`}
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BatteryInspection;
