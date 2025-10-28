import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, UserPlus, Home, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  getAllStaff,
  createStaffAccount,
  cancelStaffAssign,
  assignOrActivateStaff,
} from "../../services/axios.services";

// 👇 Thêm Select của shadcn/ui
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);

  // DEMO station cứng (không ảnh hưởng nhập tay stationId)
  const [stations] = useState([
    { id: 1, name: "Trạm Bình Thạnh", address: "789 Xô Viết Nghệ Tĩnh", maxStaff: 2 },
    { id: 2, name: "Trạm Quận 1", address: "123 Lê Lợi", maxStaff: 2 },
    { id: 3, name: "Trạm Thủ Đức", address: "456 Võ Văn Ngân", maxStaff: 2 },
    { id: 4, name: "Trạm Tân Bình", address: "321 Cộng Hòa", maxStaff: 2 },
  ]);

  // Helpers – interceptor đã trả về .data
  const pickApiMessage = (data) =>
    data?.messages?.auth ||
    data?.messages?.business ||
    data?.error ||
    "Có lỗi xảy ra. Vui lòng thử lại.";

  const isErrorResponse = (data) =>
    !!data?.error || !!data?.messages?.auth || !!data?.messages?.business;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    stationId: "", // nhập tay, có thể rỗng => null
  });

  const [addLoading, setAddLoading] = useState(false);

  // Assign dialog: chỉ nhập stationId, staffId giữ trong state ẩn
  const [pendingAssignStaffId, setPendingAssignStaffId] = useState(null);
  const [assignStationId, setAssignStationId] = useState("");

  // loading theo từng dòng khi thao tác
  const [rowLoading, setRowLoading] = useState({}); // { [staffId]: boolean }

  // ---- Fetch staff (mount & khi cần) ----
  const fetchStaff = useCallback(async () => {
    try {
      const response = await getAllStaff(); // array
      const normalized = (response ?? []).map((s) => ({
        staffId: s.staffId ?? s.id ?? "",
        fullName: s.fullName ?? s.name ?? "",
        email: s.email ?? "",
        active: typeof s.active === "boolean" ? s.active : !!s.stationId,
        stationId:
          s.stationId === undefined || s.stationId === null || s.stationId === ""
            ? null
            : s.stationId,
        stationName: s.stationName ?? null,
      }));
      setStaffList(normalized);
    } catch (error) {
      console.error("❌ Error fetching staff data:", error);
      toast.error("Không thể tải danh sách nhân viên");
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Stats
  const totalStaff = staffList.length;
  const assignedStaff = staffList.filter((s) => s.stationId !== null).length;
  const unassignedStaff = totalStaff - assignedStaff;

  // Map stationId -> count
  const stationStaffCounts = useMemo(() => {
    const counts = new Map();
    for (const st of stations) counts.set(st.id, 0);
    for (const s of staffList) {
      const sid =
        s.stationId === null || s.stationId === undefined || s.stationId === ""
          ? null
          : Number(s.stationId);
      if (sid && counts.has(sid)) counts.set(sid, counts.get(sid) + 1);
    }
    return counts;
  }, [staffList, stations]);

  // ---- Actions (API). Thành công => fetchStaff() ----
  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Vui lòng nhập đầy đủ tên, email và mật khẩu");
      return;
    }

    let stationIdMapped = null;
    if (formData.stationId.trim() !== "") {
      const parsed = Number(formData.stationId);
      if (Number.isNaN(parsed)) {
        toast.error("Station ID phải là số hoặc để trống");
        return;
      }
      stationIdMapped = parsed;
    }

    setAddLoading(true);
    try {
      const data = await createStaffAccount(
        formData.name,
        formData.email,
        formData.password,
        stationIdMapped
      );
      if (isErrorResponse(data)) {
        toast.error(pickApiMessage(data));
        return;
      }
      toast.success("Tạo tài khoản nhân viên thành công");
      setIsAddDialogOpen(false);
      setFormData({ name: "", email: "", password: "", stationId: "" });
      await fetchStaff();
    } catch (error) {
      console.error("Create staff error:", error);
      toast.error("Không thể tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setAddLoading(false);
    }
  };

  // Assign: gửi { stationId, active: null }
  const handleAssignConfirm = async () => {
    const parsed = Number(assignStationId);
    if (!pendingAssignStaffId) return toast.error("Thiếu staffId");
    if (!assignStationId || Number.isNaN(parsed)) {
      return toast.error("Station ID phải là số");
    }

    const sid = pendingAssignStaffId;
    setRowLoading((m) => ({ ...m, [sid]: true }));
    try {
      const res = await assignOrActivateStaff(sid, parsed, null);
      if (isErrorResponse(res)) {
        toast.error(pickApiMessage(res));
        return;
      }
      toast.success("Đã phân công nhân viên");
      setIsAssignDialogOpen(false);
      setPendingAssignStaffId(null);
      setAssignStationId("");
      await fetchStaff();
    } catch (err) {
      console.error("Assign error:", err);
      toast.error("Không thể phân công. Vui lòng thử lại.");
    } finally {
      setRowLoading((m) => ({ ...m, [sid]: false }));
    }
  };

  // Hủy assign: POST /unassign
  const handleUnassignStaff = async (staffId) => {
    setRowLoading((m) => ({ ...m, [staffId]: true }));
    try {
      const res = await cancelStaffAssign(staffId);
      if (isErrorResponse(res)) {
        toast.error(pickApiMessage(res));
        return;
      }
      toast.success("Đã hủy phân công nhân viên");
      await fetchStaff();
    } catch (err) {
      console.error("Unassign error:", err);
      toast.error("Không thể hủy phân công. Vui lòng thử lại.");
    } finally {
      setRowLoading((m) => ({ ...m, [staffId]: false }));
    }
  };

  // ✅ Đổi trạng thái bằng Select: gửi { stationId: null, active: nextActive }
  const handleChangeActive = async (staff, nextActive) => {
    const sid = staff.staffId;
    setRowLoading((m) => ({ ...m, [sid]: true }));

    try {
      const res = await assignOrActivateStaff(sid, null, nextActive);
      if (isErrorResponse(res)) {
        toast.error(pickApiMessage(res));
        // rollback UI (fetch lại dữ liệu chính xác từ BE)
        await fetchStaff();
        return;
      }
      toast.success(nextActive ? "Đã đặt Hoạt động" : "Đã đặt Không hoạt động");
      await fetchStaff();
    } catch (err) {
      console.error("Change active error:", err);
      toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      await fetchStaff();
    } finally {
      setRowLoading((m) => ({ ...m, [sid]: false }));
    }
  };

  // --- Open dialogs ---
  const openEditDialog = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.fullName ?? "",
      email: staff.email ?? "",
      password: "",
      stationId:
        staff.stationId === null || staff.stationId === undefined
          ? ""
          : String(staff.stationId),
    });
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (staff) => {
    setPendingAssignStaffId(staff.staffId);
    setAssignStationId("");
    setIsAssignDialogOpen(true);
  };

  // Helper: suy ra stationName từ hardcode khi BE chưa trả
  const getStationDisplay = (sid, sname) => {
    if (sid === null || sid === undefined) return null;
    const byId = stations.find((st) => st.id === Number(sid));
    const name = sname ?? byId?.name ?? "—";
    return { id: Number(sid), name };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Quản lý nhân viên</h1>
              <p className="text-blue-100 text-sm">Phân công và điều hành nhân sự</p>
            </div>
          </div>
          <Link to="/admin">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{totalStaff}</h3>
              <p className="text-muted-foreground">Tổng nhân viên</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{assignedStaff}</h3>
              <p className="text-muted-foreground">Đã phân công</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{unassignedStaff}</h3>
              <p className="text-muted-foreground">Chưa phân công</p>
            </CardContent>
          </Card>
        </div>

        {/* Station Status Overview (DEMO) */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              Tình trạng trạm làm việc
            </CardTitle>
            <CardDescription>Số lượng nhân viên hiện tại tại mỗi trạm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stations.map((station) => {
                const count = stationStaffCounts.get(station.id) ?? 0;
                const isFullyStaffed = count >= station.maxStaff;
                const isEmpty = count === 0;

                const staffsAtStation = staffList.filter((s) => {
                  const sid =
                    s.stationId === null || s.stationId === undefined || s.stationId === ""
                      ? null
                      : Number(s.stationId);
                  return sid === station.id;
                });

                return (
                  <Card
                    key={station.id}
                    className={`border-l-4 transition-all duration-300 hover:scale-105 ${isEmpty
                      ? "border-l-red-500 bg-red-50"
                      : isFullyStaffed
                        ? "border-l-green-500 bg-green-50"
                        : "border-l-yellow-500 bg-yellow-50"
                      }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800">{station.name}</h3>
                          <Badge
                            variant={
                              isEmpty ? "destructive" : isFullyStaffed ? "default" : "secondary"
                            }
                          >
                            {count}/{station.maxStaff}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{station.address}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Nhân viên:</span>
                            <span
                              className={`font-medium ${isEmpty
                                ? "text-red-600"
                                : isFullyStaffed
                                  ? "text-green-600"
                                  : "text-yellow-600"
                                }`}
                            >
                              {count}/{station.maxStaff}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${isEmpty
                                ? "bg-red-500"
                                : isFullyStaffed
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                                }`}
                              style={{ width: `${(count / station.maxStaff) * 100}%` }}
                            />
                            <div className="space-y-1">
                              {staffsAtStation.map((s) => (
                                <div key={s.staffId} className="flex items-center text-xs text-gray-600">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  {s.fullName}
                                </div>
                              ))}
                              {count === 0 && (
                                <div className="text-xs text-gray-500 italic">Chưa có thông tin</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Management */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Danh sách nhân viên
                </CardTitle>
                <CardDescription>Quản lý tất cả nhân viên trong hệ thống</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm nhân viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm nhân viên mới</DialogTitle>
                    <DialogDescription>Nhập thông tin nhân viên mới</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nhập họ và tên"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Nhập email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Mật khẩu *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mật khẩu tạm thời"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stationId">Station ID (có thể để trống)</Label>
                      <Input
                        id="stationId"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Gán trạm làm việc"
                        value={formData.stationId}
                        onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleAddStaff} disabled={addLoading}>
                      {addLoading ? "Đang tạo..." : "Thêm nhân viên"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã số</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạm làm việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => {
                  const stationDisplay = getStationDisplay(staff.stationId, staff.stationName);
                  const isBusy = !!rowLoading[staff.staffId];

                  return (
                    <TableRow key={staff.staffId}>
                      <TableCell>{staff.staffId}</TableCell>
                      <TableCell className="font-medium">{staff.fullName}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        {stationDisplay ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {stationDisplay.id} - {stationDisplay.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Chưa phân công</span>
                        )}
                      </TableCell>

                      {/* ✅ Select trạng thái */}
                      <TableCell>
                        <div className="min-w-[160px]">
                          <Select
                            value={staff.active ? "active" : "inactive"}
                            disabled={isBusy}
                            onValueChange={(val) =>
                              handleChangeActive(staff, val === "active")
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Hoạt động</SelectItem>
                              <SelectItem value="inactive">Không hoạt động</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(staff)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          {staff.stationId === null ? (
                            // Chưa assign -> cho assign
                            <Button
                              size="sm"
                              onClick={() => openAssignDialog(staff)}
                              disabled={isBusy}
                            >
                              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                            </Button>
                          ) : (
                            // Đang có station -> Hủy assign
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignStaff(staff.staffId)}
                              disabled={isBusy}
                            >
                              {isBusy ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Đang hủy...
                                </>
                              ) : (
                                "Hủy assign"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>Cập nhật thông tin nhân viên</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Họ và tên</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={() => {
                  // chỉ cập nhật UI cho demo
                  if (selectedStaff && formData.name && formData.email) {
                    setStaffList((list) =>
                      list.map((s) =>
                        s.staffId === selectedStaff.staffId
                          ? { ...s, fullName: formData.name, email: formData.email }
                          : s
                      )
                    );
                    setSelectedStaff(null);
                    setFormData({ name: "", email: "", password: "", stationId: "" });
                    setIsEditDialogOpen(false);
                    toast.success("Đã cập nhật thông tin nhân viên (UI)");
                  }
                }}
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog (chỉ nhập Station ID) */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phân công nhân viên vào trạm</DialogTitle>
              <DialogDescription>Nhập Station ID để gán cho nhân viên</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assign-station">Station ID *</Label>
                <Input
                  id="assign-station"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="VD: 12"
                  value={assignStationId}
                  onChange={(e) => setAssignStationId(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAssignConfirm}>Xác nhận Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffManagement;
