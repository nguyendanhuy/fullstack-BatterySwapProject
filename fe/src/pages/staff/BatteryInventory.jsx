import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Battery, Search, Edit, Trash, Plus, Grid3x3, List, RefreshCw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useStompBattery } from "../../hooks/useStompBattery";
import { insertBatteryInventory, removeBatteryInventory, batteryStatusUpdate } from "../../services/axios.services";
// ======================
// Map status BE ↔ UI
// ======================
function mapBeStatusToUi(status) {
  switch ((status || "").toUpperCase()) {
    case "AVAILABLE":
      return "full";
    case "CHARGING":
      return "charging";
    case "WAITING":
      return "waiting";
    case "MAINTENANCE":
    case "IN_USE":
      return "empty";
    default:
      return "empty"; // fallback an toàn
  }
}

function mapUiStatusToBe(statusUi) {
  switch ((statusUi || "").toLowerCase()) {
    case "full":
      return "AVAILABLE";     // pin đầy
    case "charging":
      return "CHARGING";      // đang sạc
    case "waiting":
      return "WAITING";       // thêm case mới
    case "empty":
      return "MAINTENANCE";   // slot trống hoặc đang bảo trì
    case "error":
      return "MAINTENANCE";   // BE không có ERROR
    default:
      return "MAINTENANCE";   // fallback an toàn
  }
}

// ======================
/** Capacity cố định theo BE: A=10, B=5, C=5 */
const DOCK_CAPACITY = { A: 10, B: 5, C: 5 };

function getDockCapacity(dockName) {
  const key = String(dockName || "").toUpperCase();
  return DOCK_CAPACITY[key] ?? 0;
}

function isValidSlotCodeForDock(slotCode, dockName) {
  if (!slotCode) return false;
  const prefix = String(dockName || "").toUpperCase(); // "A" | "B" | "C"
  const code = slotCode.toUpperCase().trim();
  if (!code.startsWith(prefix)) return false;
  const num = Number(code.replace(/^[A-Z]+/, ""));
  const cap = getDockCapacity(prefix);
  return Number.isInteger(num) && num >= 1 && num <= cap;
}

// ===============
// Component chính
// ===============
const BatteryInventory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBattery, setEditingBattery] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedDockIndex, setSelectedDockIndex] = useState(0);
  const STATION_ID = 1;
  // WebSocket hooks (để sẵn nếu bạn muốn dùng)
  const { connected, connect, disconnect, subscribeStation, subscribeStationGrouped, sendJoinStation } = useStompBattery();
  const unsubRef = useRef(null);

  // DỮ LIỆU CHÍNH LẤY TỪ BE
  const [docksData, setDocksData] = useState([]);

  // Form Add / Edit — map về UI cũ cho dễ dùng
  const [newBattery, setNewBattery] = useState({
    batteryId: "",
    slotId: "",
  });

  const [detailForm, setDetailForm] = useState({
    batteryId: "",
    statusUi: "empty"
  });

  useEffect(() => {
    if (isEditDialogOpen && selectedBattery) {
      setDetailForm({
        batteryId: selectedBattery.id || "",
        statusUi: selectedBattery.status || "empty",
      });
    }
  }, [isEditDialogOpen, selectedBattery]);

  // ====================
  // Chay real time
  // ====================

  // Áp dụng snapshot ban đầu
  const applySnapshot = (grouped) => {
    // grouped: [{ dockName: "A"|"B"|"C", slots: [{ slotId, slotNumber, slotCode, batteryId, batteryType, batteryStatus, currentCapacity, stateOfHealth }]}]
    if (!Array.isArray(grouped)) return;
    setDocksData(grouped);
  };


  // Xử lý event realtime
  const applyRealtimeEvent = (evt) => {
    console.log("Received battery event:", evt);
    if (!evt || Number(evt.stationId) !== Number(STATION_ID)) return;

    setDocksData((prev) => {
      const next = structuredClone(prev || []);

      const dockIdx = next.findIndex(
        d => String(d.dockName).toUpperCase() === String(evt.dockName || "").toUpperCase()
      );
      if (dockIdx === -1) return prev;

      const slots = next[dockIdx].slots || [];
      const idx = slots.findIndex(s => Number(s.slotNumber) === Number(evt.slotNumber));
      const action = String(evt.action || "").toUpperCase();

      // Nếu pin bị rút ra khỏi slot → để slot trống (giữ slotCode/slotNumber)
      if (action === "EJECTED" || action === "REMOVED") {
        if (idx !== -1) {
          slots[idx] = {
            ...slots[idx],
            batteryId: null,
            batteryType: null,
            batteryStatus: "MAINTENANCE",
            currentCapacity: 0,
            stateOfHealth: 0
          };
        }
        next[dockIdx].slots = slots;
        return next;
      }

      // Ngược lại: ghi nhận thông tin pin mới/cập nhật
      const patch = {
        batteryId: evt.batteryId ?? slots[idx]?.batteryId,
        batteryType: (evt.batteryType || slots[idx]?.batteryType || "").toUpperCase().replaceAll(" ", "_"),
        batteryStatus: evt.batteryStatus ?? slots[idx]?.batteryStatus ?? "MAINTENANCE",
        currentCapacity: evt.currentCapacity != null ? Math.round(evt.currentCapacity) : (slots[idx]?.currentCapacity ?? 0),
        stateOfHealth: evt.stateOfHealth != null ? Math.round(evt.stateOfHealth) : (slots[idx]?.stateOfHealth ?? 0)
      };

      if (idx === -1) {
        // slot chưa có trong list → tạo mới
        slots.push({
          slotId: evt.slotId ?? Date.now(),
          slotNumber: Number(evt.slotNumber),
          slotCode: `${String(evt.dockName).toUpperCase()}${evt.slotNumber}`,
          ...patch
        });
      } else {
        slots[idx] = { ...slots[idx], ...patch };
      }

      next[dockIdx].slots = slots;
      return next;
    });
  };


  // Mở kết nối khi vào trang, đóng khi rời
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Khi đã connected: sub snapshot & events, rồi gửi yêu cầu JOIN để BE push snapshot
  const groupedUnsubRef = useRef(null);
  const eventsUnsubRef = useRef(null);

  useEffect(() => {
    if (!connected) return;

    // Hủy sub cũ nếu đổi trạm
    groupedUnsubRef.current?.();
    eventsUnsubRef.current?.();

    groupedUnsubRef.current = subscribeStationGrouped(STATION_ID, applySnapshot);
    eventsUnsubRef.current = subscribeStation(STATION_ID, applyRealtimeEvent);

    // Gửi yêu cầu tham gia trạm → BE sẽ broadcast snapshot vào kênh `/grouped`
    sendJoinStation(STATION_ID);

    return () => {
      groupedUnsubRef.current?.();
      eventsUnsubRef.current?.();
    };
  }, [connected, subscribeStationGrouped, subscribeStation, sendJoinStation]);



  // ============
  // Load dữ liệu
  // ============

  // ======================
  // Adapter cho UI hiện tại (chỉ A,B,C; ép capacity cố định)
  // ======================
  const docks = ["A", "B", "C"].map((dockKey) => {
    const d =
      (docksData || []).find(
        (x) => String(x.dockName).toUpperCase() === dockKey
      ) || { dockName: dockKey, slots: [] };
    const capacity = getDockCapacity(d.dockName);
    return {
      name: `Dock ${dockKey}`,
      code: dockKey,
      capacity,
      slots: (d.slots || []).map((s) => ({
        slotId: s.slotId,
        slotNumber: s.slotNumber,
        location: s.slotCode, // A1, A2...
        id: s.batteryId, // mã pin
        type: (s.batteryType || "").replaceAll("_", " "), // hiển thị đẹp
        status: mapBeStatusToUi(s.batteryStatus), // status UI
        charge: Math.round(s.currentCapacity || 0), // %
        soh: `${Math.round(s.stateOfHealth || 0)}%`, // text %
      })),
    };
  });

  const currentDock = docks[selectedDockIndex] || { name: "", capacity: 0, slots: [] };

  // Đếm trạng thái tổng (trên tất cả dock)
  const allSlotsFlat = docks.flatMap((d) => d.slots);
  const statusCounts = {
    full: allSlotsFlat.filter((s) => s.status === "full").length,
    charging: allSlotsFlat.filter((s) => s.status === "charging").length,
    empty: allSlotsFlat.filter((s) => s.status === "empty").length,
  };

  // Lấy thống kê theo dock
  const getDockStats = (dockIdx) => {
    const dock = docks[dockIdx];
    if (!dock) return null;
    const slots = dock.slots || [];
    const totalWithBattery = slots.filter(s => s.id || s.batteryId).length;
    return {
      total: totalWithBattery,
      capacity: dock.capacity,
      full: dock.slots.filter((b) => b.status === "full").length,
      charging: dock.slots.filter((b) => b.status === "charging").length,
      empty: dock.slots.filter((b) => b.status === "empty").length,
      utilization: dock.capacity ? Math.round((dock.slots.length / dock.capacity) * 100) : 0,
    };
  };

  // Sinh ma trận 5 cột; fill các ô trống nếu thiếu cho đủ capacity
  const generateDockSlots = (dockIdx) => {
    const dock = docks[dockIdx];
    if (!dock) return [];
    const { capacity } = dock;

    const filled = [...dock.slots]; // slot đã có pin
    // Tạo danh sách ô trống theo slotNumber nếu chưa đủ
    for (let i = 1; i <= capacity; i++) {
      const code = `${dock.code}${i}`; // A1..A10 | B/C 1..5
      const exists = filled.some((s) => s.location === code);
      if (!exists) {
        filled.push({
          slotId: `EMPTY-${dock.code}-${i}`,
          slotNumber: i,
          location: code,
          id: null,
          type: "",
          status: "empty",
          charge: 0,
          soh: "",
          lastUpdated: "",
          isEmpty: true,
        });
      }
    }

    // Sort theo slotNumber để ra đúng thứ tự
    filled.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
    return filled;
  };

  // ==============
  // UI utilities
  // ==============
  const getStatusBadge = (status) => {
    switch (status) {
      case "full":
        return <Badge className="bg-success text-white">Pin đầy</Badge>;
      case "charging":
        return <Badge className="bg-charging text-white">Đang sạc</Badge>;
      case "waiting":
        return (
          <Badge className="bg-yellow-500 text-white">Đang chờ</Badge>
        ); // 🌟 badge cho WAITING
      case "empty":
        return <Badge variant="secondary">Pin đang bảo trì</Badge>;
      case "error":
        return (
          <Badge className="bg-destructive text-destructive-foreground">Lỗi</Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "full":
        return "from-green-400 to-emerald-500";
      case "charging":
        return "from-blue-400 to-indigo-500";
      case "waiting":
        return "from-yellow-400 to-amber-500";
      case "empty":
        return "from-gray-300 to-gray-400";
      case "error":
        return "from-red-400 to-rose-500";
      default:
        return "from-gray-200 to-gray-300";
    }
  };

  // ============
  // Handlers CRUD
  // ============
  const handleAddBattery = async () => {
    const batteryId = (newBattery.batteryId || "").trim();
    const slotIdNum = Number(newBattery.slotId);

    if (!batteryId || !Number.isInteger(slotIdNum) || slotIdNum <= 0) {
      toast({
        title: "Thiếu hoặc sai dữ liệu",
        description: "Vui lòng nhập batteryId (chuỗi) và slotId (số nguyên dương).",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await insertBatteryInventory(slotIdNum, batteryId);

      if (res.messages?.business || res?.error || res?.status >= 400) {
        toast({
          title: "Thêm pin thất bại",
          description: res?.messages?.business || res?.error || "Đã xảy ra lỗi.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Thêm pin thành công",
          description: `Đã gắn pin ${batteryId} vào slotId ${slotIdNum}.`,
        });
        setNewBattery({ batteryId: "", slotId: "" });
        setIsAddDialogOpen(false);
      }
    } catch (err) {
      toast({
        title: "Thêm pin thất bại",
        description: "Đã xảy ra lỗi.",
        variant: "destructive",
      });
    } finally {
      setIsAddDialogOpen(false);
    }
  };

  const handleEditBattery = (slot) => {
    setEditingBattery(slot);
    setEditBattery({
      id: slot.id,
      type: slot.type,
      status: slot.status,
      soh: String(parseInt(slot.soh || "0")),
      location: slot.location, // slotCode
      dockIndex: selectedDockIndex,
      slotId: slot.slotId,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBattery = () => {
    if (!editBattery.type || !editBattery.status || !editBattery.location) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    const sohValue = parseInt(editBattery.soh);
    if (isNaN(sohValue) || sohValue < 0 || sohValue > 100) {
      toast({
        title: "Lỗi SoH",
        description: "SoH phải là số từ 0-100",
        variant: "destructive",
      });
      return;
    }

    const di = Number(editBattery.dockIndex) || 0;
    const uiDock = docks[di];
    if (!uiDock) return;

    const newLoc = editBattery.location.toUpperCase().trim();

    // Kiểm tra hợp lệ vị trí theo dock & capacity cố định
    if (!isValidSlotCodeForDock(newLoc, uiDock.code)) {
      toast({
        title: "Vị trí không hợp lệ",
        description: `Vị trí phải thuộc ${uiDock.name} và trong khoảng ${uiDock.code}1..${uiDock.code}${uiDock.capacity}`,
        variant: "destructive",
      });
      return;
    }

    const updated = structuredClone(docksData);
    const curSlots = updated[di]?.slots || [];
    const slotIdx = curSlots.findIndex((s) => s.slotId === editBattery.slotId);
    if (slotIdx === -1) {
      toast({ title: "Không tìm thấy slot", variant: "destructive" });
      return;
    }

    // Check duplicate location trong dock (trừ slot hiện tại)
    const dupLoc = curSlots.find(
      (s) => s.slotCode === newLoc && s.slotId !== editBattery.slotId
    );
    if (dupLoc) {
      toast({
        title: "Vị trí đã tồn tại",
        description: `Vị trí ${newLoc} đã có pin ${dupLoc.batteryId}`,
        variant: "destructive",
      });
      return;
    }

    const beStatus = mapUiStatusToBe(editBattery.status);

    curSlots[slotIdx] = {
      ...curSlots[slotIdx],
      batteryId: editBattery.id,
      batteryType: (editBattery.type || "").toUpperCase().replaceAll(" ", "_"),
      batteryStatus: beStatus,
      currentCapacity: sohValue,
      stateOfHealth: sohValue,
      slotCode: newLoc,
      slotNumber: Number(newLoc.replace(/^[A-Z]+/, "")) || curSlots[slotIdx].slotNumber,
    };

    setDocksData(updated);

    if (selectedBattery?.slotId === editBattery.slotId) {
      setSelectedBattery({
        ...selectedBattery,
        id: editBattery.id,
        type: editBattery.type,
        status: editBattery.status,
        soh: `${sohValue}%`,
        location: newLoc,
        charge: sohValue,
      });
    }

    toast({
      title: "Cập nhật pin thành công",
      description: `Thông tin pin ${editBattery.id} đã được cập nhật`,
    });

    setIsEditDialogOpen(false);
    setEditingBattery(null);
  };

  const handleRemoveBattery = async (batteryId) => {
    if (!batteryId?.trim()) {
      toast({
        title: "Thiếu mã pin",
        description: "Vui lòng nhập batteryId hợp lệ.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await removeBatteryInventory(batteryId);
      if (res?.messages?.business || res?.error || res?.status >= 400) {
        toast({
          title: "Tháo pin thất bại",
          description: (res?.messages?.business || res?.error || "Đã xảy ra lỗi."),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tháo pin thành công",
          description: `Đã tháo pin ${batteryId} khỏi slot.`,
        });
        setSelectedBattery(null);
        setIsDetailPanelOpen(false);
      }
    } catch (err) {
      toast({
        title: "Tháo pin thất bại",
        description: "Đã xảy ra lỗi.",
        variant: "destructive",
      });
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.isEmpty || !slot.id) return;
    setSelectedBattery(slot);
    setIsDetailPanelOpen(true);
  };

  const handleRefresh = () => {
    loadDockData();
    toast({
      title: "Đã làm mới",
      description: "Dữ liệu đã được cập nhật",
    });
  };

  // Lấy danh sách theo dock + filter tìm kiếm (áp dụng cho list view)
  const getCurrentDockSlotsFiltered = () => {
    const slots = docks[selectedDockIndex]?.slots || [];
    return slots.filter((s) => {
      const okSearch =
        !searchTerm ||
        s.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const okStatus = !statusFilter || statusFilter === "all" || s.status === statusFilter;
      return okSearch && okStatus;
    });
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-6 py-8 max-w-7xl pb-32">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Quản lý tồn kho pin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi và quản lý tồn kho pin tại trạm
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mx-auto mb-4 w-fit">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-gray-800">
                {statusCounts.full}
              </h3>
              <p className="text-gray-600 font-medium">Pin đầy</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mx-auto mb-4 w-fit">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-gray-800">
                {statusCounts.charging}
              </h3>
              <p className="text-gray-600 font-medium">Đang sạc</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl mx-auto mb-4 w-fit">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-gray-800">
                {statusCounts.empty}
              </h3>
              <p className="text-gray-600 font-medium">Bảo trì</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 w-fit">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-gray-800">{allSlotsFlat.length}</h3>
              <p className="text-gray-600 font-medium">Tổng số</p>
            </CardContent>
          </Card>
        </div>

        {/* Dock Selector */}
        <Card className="mb-6 border-0 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              {docks.map((dock, idx) => {
                const stats = getDockStats(idx);
                const isActive = selectedDockIndex === idx;

                return (
                  <button
                    key={dock.code || idx}
                    onClick={() => setSelectedDockIndex(idx)}
                    className={cn(
                      "flex-1 min-w-[200px] p-6 rounded-xl transition-all duration-300",
                      "border-2 hover:scale-105 hover:shadow-lg",
                      isActive
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <Building2
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-indigo-600" : "text-gray-400"
                          )}
                        />
                        <h3
                          className={cn(
                            "font-bold text-lg",
                            isActive ? "text-indigo-700" : "text-gray-600"
                          )}
                        >
                          {dock.name}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            isActive ? "text-indigo-600" : "text-gray-500"
                          )}
                        >
                          {stats?.total}/{stats?.capacity}
                        </p>
                        <p className="text-sm text-gray-500">pin đang hoạt động</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              isActive
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                : "bg-gray-400"
                            )}
                            style={{ width: `${stats?.utilization || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-center gap-2 text-xs">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            ⚡ {stats?.full} đầy
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            🔋 {stats?.charging} sạc
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search & Actions */}
        <Card className="mb-6 border-0 shadow-lg bg-white animate-slide-up">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo mã pin, loại pin hoặc vị trí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="full">Pin đầy</SelectItem>
                  <SelectItem value="charging">Đang sạc</SelectItem>
                  <SelectItem value="empty">Bảo trì</SelectItem>
                  <SelectItem value="error">Lỗi</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} className="hover:bg-gray-100">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none"
                  >
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    Lưới
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Danh sách
                  </Button>
                </div>
              </div>

              {/* Add Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm pin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Thêm pin mới</DialogTitle>
                    <DialogDescription>
                      Nhập <b>batteryId</b> và <b>slotId</b> để gắn pin vào vị trí.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Battery ID</Label>
                      <Input
                        value={newBattery.batteryId}
                        onChange={(e) => setNewBattery({ ...newBattery, batteryId: e.target.value })}
                        placeholder="VD: BAT016"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Slot ID</Label>
                      <Input
                        type="number"
                        value={newBattery.slotId}
                        onChange={(e) => setNewBattery({ ...newBattery, slotId: e.target.value })}
                        placeholder="VD: 57"
                        min="1"
                      />
                      <p className="text-xs text-gray-500">
                        Gợi ý: xem <i>SlotID</i> trên ô lưới (label góc dưới bên trái).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddBattery} className="flex-1">Thêm pin</Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Ma trận pin - {currentDock.name}
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({(currentDock.slots || []).length} pin)
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {generateDockSlots(selectedDockIndex).map((slot, index) => {
                const isOccupied = !slot.isEmpty && !!slot.id;
                const isSelected = selectedBattery?.slotId === slot.slotId;

                return (
                  <Tooltip key={`${slot.location}-${slot.slotId}`}>
                    <TooltipTrigger asChild>
                      <Card
                        className={cn(
                          "relative aspect-square cursor-pointer transition-all duration-300",
                          "hover:scale-105 hover:shadow-xl animate-fade-in",
                          isSelected && "ring-4 ring-blue-500 ring-offset-2",
                          slot.status === "charging" && "animate-pulse-glow",
                          !isOccupied && "opacity-50 hover:opacity-70"
                        )}
                        style={{ animationDelay: `${index * 0.02}s` }}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <CardContent
                          className={cn(
                            "p-4 h-full flex flex-col items-center justify-center",
                            "bg-gradient-to-br rounded-lg",
                            getSlotColor(slot.status)
                          )}
                        >
                          <div className="text-xs font-bold text-white/90 mb-2">
                            {slot.location}
                          </div>
                          <Battery
                            className={cn(
                              "h-10 w-10 text-white",
                              slot.status === "charging" && "animate-pulse"
                            )}
                          />
                          {isOccupied && (
                            <div className="text-xl font-bold text-white mt-2">
                              {slot.charge}%
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/35 text-white/90 backdrop-blur-sm">
                            SlotID: {String(slot.slotId)}
                          </div>
                          {slot.status === "charging" && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
                          )}
                          {slot.status === "error" && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                          )}

                          {isOccupied && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/60 transition-all duration-300 opacity-0 hover:opacity-100 rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBattery(slot);
                                }}
                                className="bg-white/90 hover:bg-white text-gray-800"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBattery(slot.id);
                                  setIsDetailPanelOpen(false);
                                }}
                                className="bg-white/90 hover:bg-white text-gray-800"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TooltipTrigger>

                    {isOccupied && (
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">Mã pin: {slot.id}</p>
                          <p>SoH: {slot.soh}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Danh sách pin - {currentDock.name}
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({(currentDock.slots || []).length} pin)
                </span>
              </h2>
            </div>

            <div className="grid gap-6">
              {getCurrentDockSlotsFiltered().map((slot, index) => (
                <Card
                  key={`${slot.location}-${slot.slotId}`}
                  className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-800">
                          {slot.id || "(trống)"}
                        </h3>
                        <p className="text-sm text-gray-600">{slot.type}</p>
                      </div>

                      <div className="flex justify-start">{getStatusBadge(slot.status)}</div>

                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">SoH</p>
                        <p
                          className={`font-semibold ${parseInt(slot.soh) > 90
                            ? "text-green-600"
                            : parseInt(slot.soh) > 80
                              ? "text-orange-500"
                              : "text-red-500"
                            }`}
                        >
                          {slot.soh || "0%"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Vị trí</p>
                        <p className="text-sm font-medium text-gray-700">{slot.location}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Cập nhật</p>
                        <p className="text-xs text-gray-500">{slot.lastUpdated || "—"}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBattery(slot)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBattery(slot.id)}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                          disabled={!slot.id} // ô trống thì disable
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Detail Panel */}
        <Sheet open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Chi tiết pin {selectedBattery?.id}
              </SheetTitle>
              <SheetDescription>Thông tin chi tiết và biểu đồ sạc</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trạng thái</span>
                    {getStatusBadge(selectedBattery?.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loại pin</span>
                    <span className="font-medium">{selectedBattery?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dock</span>
                    <span className="font-medium">{docks[selectedDockIndex]?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vị trí</span>
                    <span className="font-medium">{selectedBattery?.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SoH</span>
                    <span className="font-bold text-green-600">{selectedBattery?.soh}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Mức sạc hiện tại</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={selectedBattery?.charge || 0} className="h-3" />
                    <p className="text-right text-sm text-gray-600">
                      {selectedBattery?.charge}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Biểu đồ sạc</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-400">Biểu đồ sạc theo thời gian</p>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                  onClick={() => {
                    if (selectedBattery) handleEditBattery(selectedBattery);
                    setIsDetailPanelOpen(false);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>

                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (selectedBattery)
                      handleRemoveBattery(selectedBattery.id);
                    setIsDetailPanelOpen(false);
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Tháo pin
                </Button>

                <Button variant="outline" onClick={() => setIsDetailPanelOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cập nhật thông tin pin</DialogTitle>
              <DialogDescription>Chỉnh sửa thông tin trạng thái của pin {editBattery.id}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Mã pin</Label>
                <Input value={editBattery.id} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Loại pin</Label>
                <Select
                  value={editBattery.type}
                  onValueChange={(value) => setEditBattery({ ...editBattery, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LITHIUM ION">Lithium-ion</SelectItem>
                    <SelectItem value="NICKEL METAL HYDRIDE">Nickel Metal Hydride</SelectItem>
                    <SelectItem value="LEAD ACID">Lead Acid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={editBattery.status}
                  onValueChange={(value) => setEditBattery({ ...editBattery, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Pin đầy</SelectItem>
                    <SelectItem value="charging">Đang sạc</SelectItem>
                    <SelectItem value="empty">Bảo trì</SelectItem>
                    <SelectItem value="error">Lỗi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dock</Label>
                <Select
                  value={String(editBattery.dockIndex)}
                  onValueChange={(value) =>
                    setEditBattery({ ...editBattery, dockIndex: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {docks.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SoH (%)</Label>
                  <Input
                    type="number"
                    value={editBattery.soh}
                    onChange={(e) => setEditBattery({ ...editBattery, soh: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vị trí (slotCode)</Label>
                  <Input
                    value={editBattery.location}
                    onChange={(e) =>
                      setEditBattery({ ...editBattery, location: e.target.value.toUpperCase() })
                    }
                    placeholder={`VD: ${docks[editBattery.dockIndex]?.code || "A"
                      }1 .. ${docks[editBattery.dockIndex]?.code || "A"
                      }${docks[editBattery.dockIndex]?.capacity || 10}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateBattery} className="flex-1">
                Cập nhật
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default BatteryInventory;

// =======================
// SAMPLE DATA (xóa nếu đã có API thật)
// =======================
// const SAMPLE_BE_DATA = [
//   {
//     dockName: "A",
//     slots: [
//       { slotId: 57, slotNumber: 1, slotCode: "A1", batteryId: "BAT030", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 58.6585 },
//       { slotId: 58, slotNumber: 2, slotCode: "A2", batteryId: "BAT086", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 67.3779 },
//       { slotId: 59, slotNumber: 3, slotCode: "A3", batteryId: "BAT648", batteryType: "LEAD_ACID", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 91.3235 },
//       { slotId: 60, slotNumber: 4, slotCode: "A4", batteryId: "BAT019", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 91.4067 },
//       { slotId: 61, slotNumber: 5, slotCode: "A5", batteryId: "BAT179", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 50.3452 },
//       { slotId: 62, slotNumber: 6, slotCode: "A6", batteryId: "BAT269", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 92.3161 },
//       { slotId: 63, slotNumber: 7, slotCode: "A7", batteryId: "BAT302", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 54.2086 },
//       { slotId: 64, slotNumber: 8, slotCode: "A8", batteryId: "BAT817", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 94.7927 },
//       { slotId: 65, slotNumber: 9, slotCode: "A9", batteryId: "BAT595", batteryType: "LEAD_ACID", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 78.0896 },
//       { slotId: 66, slotNumber: 10, slotCode: "A10", batteryId: "BAT816", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 66.2693 },
//     ],
//   },
//   {
//     dockName: "B",
//     slots: [
//       { slotId: 72, slotNumber: 1, slotCode: "B1", batteryId: "BAT773", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 81.199 },
//       { slotId: 73, slotNumber: 2, slotCode: "B2", batteryId: "BAT156", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 56.1857 },
//       { slotId: 74, slotNumber: 3, slotCode: "B3", batteryId: "BAT203", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 59.3573 },
//       { slotId: 75, slotNumber: 4, slotCode: "B4", batteryId: "BAT404", batteryType: "LEAD_ACID", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 52.7966 },
//       { slotId: 76, slotNumber: 5, slotCode: "B5", batteryId: "BAT227", batteryType: "LEAD_ACID", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 92.7381 },
//     ],
//   },
//   {
//     dockName: "C",
//     slots: [
//       { slotId: 91, slotNumber: 1, slotCode: "C1", batteryId: "BAT579", batteryType: "LEAD_ACID", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 90.4127 },
//       { slotId: 92, slotNumber: 2, slotCode: "C2", batteryId: "BAT758", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 67.1263 },
//       { slotId: 93, slotNumber: 3, slotCode: "C3", batteryId: "BAT137", batteryType: "LITHIUM_ION", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 97.3684 },
//       { slotId: 94, slotNumber: 4, slotCode: "C4", batteryId: "BAT088", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 97.4736 },
//       { slotId: 95, slotNumber: 5, slotCode: "C5", batteryId: "BAT286", batteryType: "NICKEL_METAL_HYDRIDE", batteryStatus: "AVAILABLE", currentCapacity: 100, stateOfHealth: 75.9207 },
//     ],
//   },
// ];