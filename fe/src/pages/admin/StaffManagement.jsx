import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, UserPlus, Home, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  getAllStaff,
  createStaffAccount,
  cancelStaffAssign,
  assignStaff,
  getStationsAndStaff,
} from "../../services/axios.services";

const StaffManagement = () => {
  // Dữ liệu danh sách và các trạm
  const [staffList, setStaffList] = useState([]);
  const [stationsData, setStationsData] = useState([]);

  // Filter tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive

  // UI state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewStaffStationId, setViewStaffStationId] = useState(null); //mở Dialog theo trạm để xem nv
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [loading, setLoading] = useState({}); // object dạng Mã NV : true/false hoặc add : true/false để hiện thị loading khi gọi api        

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", stationId: "" });
  const [assignStationId, setAssignStationId] = useState("");

  const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
  const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);

  // fetchers
  const fetchStaff = async () => {
    try {
      const data = await getAllStaff();
      console.log("✅ Fetch All Staff:", data);
      setStaffList(Array.isArray(data) ? data.sort((a, b) => a.stationId - b.stationId) : []);
    } catch (err) {
      console.error("❌ Fetch Staff:", err);
      toast.error("Không thể tải danh sách nhân viên");
    }
  };

  const fetchStations = async () => {
    try {
      const data = await getStationsAndStaff();
      console.log("✅ Fetch Stations:", data);
      setStationsData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch Stations:", err);
      toast.error("Không thể tải trạng thái trạm");
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchStations();
  }, []);

  // stats
  const totalStaff = staffList.length;
  const assignedStaff = staffList.filter((s) => s.stationId !== null && s.stationId !== undefined).length;
  const unassignedStaff = totalStaff - assignedStaff;

  // actions
  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Vui lòng nhập tên, email và mật khẩu");
      return;
    }
    const stationId = formData.stationId ? Number(formData.stationId) : null;
    if (formData.stationId && Number.isNaN(stationId)) {
      toast.error("Station ID phải là số");
      return;
    }

    setLoading({ add: true });
    try {
      const data = await createStaffAccount(formData.name, formData.email, formData.password, stationId);
      console.log("✅ Create Staff Response:", data);
      if (isErrorResponse(data)) {
        toast.error(pickApiMessage(data));
        return;
      }
      toast.success("Tạo nhân viên thành công");
      setIsAddDialogOpen(false);
      setFormData({ name: "", email: "", password: "", stationId: "" });
      await fetchStaff();
      await fetchStations();
    } catch (err) {
      console.error("❌ Handle Add Staff:", err);
      toast.error("Không thể tạo nhân viên");
    } finally {
      setLoading({});
    }
  };

  const handleAssignConfirm = async () => {
    if (!selectedStaff) return toast.error("Thiếu nhân viên để phân công");
    const sid = Number(assignStationId);
    if (!assignStationId || Number.isNaN(sid)) return toast.error("Station ID phải là số");

    setLoading({ [selectedStaff.staffId]: true });
    try {
      const data = await assignStaff(selectedStaff.staffId, sid);
      console.log("✅ Assign Staff Response:", data);
      if (isErrorResponse(data)) {
        toast.error(pickApiMessage(data));
        return;
      }
      toast.success("Phân công thành công");
      setIsAssignDialogOpen(false);
      setAssignStationId("");
      setSelectedStaff(null);
      await fetchStaff();
      await fetchStations();
    } catch (err) {
      console.error("❌ Handle Assign Confirm:", err);
      toast.error("Không thể phân công");
    } finally {
      setLoading({});
    }
  };

  const handleUnassignStaff = async (staffId) => {
    setLoading({ [staffId]: true });
    try {
      const data = await cancelStaffAssign(staffId);
      console.log("✅ Unassign Staff Response:", data);
      if (isErrorResponse(data)) {
        toast.error(pickApiMessage(data));
        return;
      }
      toast.success("Hủy phân công thành công");
      await fetchStaff();
      await fetchStations();
    } catch (err) {
      console.error("❌ Handle Unassign Staff:", err);
      toast.error("Không thể hủy phân công");
    } finally {
      setLoading({});
    }
  };


  // Filter staff list (independent logic)
  const filteredStaffList = staffList.filter((staff) => {
    const matchesSearch = staff.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all"
      ? true
      : statusFilter === "active"
        ? staff.active
        : !staff.active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
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
              <Home className="h-4 w-4 mr-2" /> Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{totalStaff}</h3>
              <p className="text-muted-foreground">Tổng nhân viên</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{assignedStaff}</h3>
              <p className="text-muted-foreground">Đã phân công</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">{unassignedStaff}</h3>
              <p className="text-muted-foreground">Chưa phân công</p>
            </CardContent>
          </Card>
        </div>

        {/* Station Overview (from API) - Independent from staff list */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center text-xl">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              Tình trạng trạm làm việc
            </CardTitle>
            <CardDescription className="text-base">
              Theo dõi nhân viên tại các trạm đổi pin
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {stationsData.filter((st) => st.stationId !== null).length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Chưa có trạm nào hoạt động</p>
                </div>
              ) : (
                stationsData
                  .filter((st) => st.stationId !== null)
                  .map((st, index) => {
                    const count = st.staffList?.length || 0;
                    const isEmpty = count === 0;

                    return (
                      //bấm vào card hiện dialog
                      <Dialog key={`station-${st.stationId}-${index}`}
                        open={viewStaffStationId === st.stationId}
                        onOpenChange={
                          (open) => setViewStaffStationId(open ? st.stationId : null)
                        }>
                        <DialogTrigger asChild>
                          <Card
                            className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col
                              ${isEmpty ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50"
                                : st.active ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                                  : "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50"
                              }`}>
                            {/* Top colored bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 
                              ${isEmpty ? "bg-gradient-to-r from-red-400 to-orange-400"
                                : st.active ? "bg-gradient-to-r from-green-400 to-emerald-400"
                                  : "bg-gradient-to-r from-gray-400 to-slate-400"}`}
                            />

                            <CardContent className="p-5 pt-6 flex flex-col h-full">
                              <div className="flex flex-col h-full">
                                {/* Header - Fixed height */}
                                <div className="flex items-start justify-between gap-2 h-[72px]">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2 h-[40px]">
                                      Trạm {st.stationId} : {st.stationName}
                                    </h3>
                                    <div className="flex items-center gap-2">

                                      <Badge
                                        variant={isEmpty ? "destructive" : st.active ? "default" : "secondary"}
                                        className={`text-xs font-semibold cursor-pointer hover:opacity-80 ${!isEmpty && st.active ? "bg-green-500 hover:bg-green-600" : ""
                                          }`}>
                                        {count} nhân viên đang hoạt động
                                      </Badge>

                                    </div>
                                  </div>
                                </div>

                                {/* Address - Fixed height */}
                                <div className="flex items-start gap-2 h-[44px] mt-3">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-600 line-clamp-2 leading-snug">
                                    {st.address || "Chưa có địa chỉ"}
                                  </p>
                                </div>

                                {/* Progress bar - Fixed position at bottom */}
                                <div className="mt-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${isEmpty
                                        ? "bg-gradient-to-r from-red-400 to-orange-500"
                                        : "bg-gradient-to-r from-green-400 to-emerald-500"
                                        }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nhân viên trong {st.stationName}</DialogTitle>
                          </DialogHeader>

                          {/* Assign staff section - Show for all stations */}
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Thêm nhân viên vào trạm:
                            </Label>
                            <div className="flex gap-2">
                              <select
                                value={assignStationId}
                                onChange={(e) => setAssignStationId(e.target.value)}
                                className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm font-medium
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                hover:border-gray-300 transition-all duration-200 cursor-pointer
                                shadow-sm hover:shadow-md"
                              >
                                <option value="">-- Chọn nhân viên --</option>
                                {staffList
                                  .filter(staff => staff.stationId === null || staff.stationId === undefined)
                                  .map((staff, idx) => (
                                    <option key={`unassigned-${staff.staffId}-${idx}`} value={staff.staffId}>
                                      {staff.staffId} - {staff.fullName} ({staff.email})
                                    </option>
                                  ))
                                }
                              </select>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (!assignStationId) {
                                    toast.error("Vui lòng chọn nhân viên");
                                    return;
                                  }
                                  setLoading({ [assignStationId]: true });
                                  try {
                                    const data = await assignStaff(assignStationId, st.stationId);
                                    if (isErrorResponse(data)) {
                                      toast.error(pickApiMessage(data));
                                      return;
                                    }
                                    toast.success("Phân công thành công");
                                    setAssignStationId("");
                                    setViewStaffStationId(null);
                                    await fetchStaff();
                                    await fetchStations();
                                  } catch (err) {
                                    toast.error("Không thể phân công");
                                  } finally {
                                    setLoading({});
                                  }
                                }}
                                disabled={!assignStationId || !!loading[assignStationId]}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              >
                                {loading[assignStationId] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
                              </Button>
                            </div>
                            {staffList.filter(s => !s.stationId).length === 0 && (
                              <p className="text-xs text-gray-500 mt-2">Không có nhân viên chưa được phân công</p>
                            )}
                          </div>

                          {/* Staff list */}
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {st.staffList && st.staffList.length > 0 ? (
                              st.staffList.map((s) => {
                                const isBusy = !!loading[s.staffId];
                                return (
                                  <div
                                    key={s.staffId}
                                    className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.active ? 'bg-green-500 shadow-sm shadow-green-300' : 'bg-gray-400'}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-800 truncate">{s.staffId} - {s.fullName}</p>
                                      <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleUnassignStaff(s.staffId)} disabled={isBusy}>
                                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hủy assign"}
                                    </Button>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center py-6 px-3">
                                <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-400 italic">Chưa có nhân viên được phân công</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staff table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Danh sách nhân viên
                  </CardTitle>
                  <CardDescription>Quản lý tất cả nhân viên trong hệ thống</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                      <Plus className="h-4 w-4 mr-2" /> Thêm nhân viên
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm nhân viên mới</DialogTitle>
                      <DialogDescription>Nhập thông tin nhân viên</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập họ và tên" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email" />
                      </div>
                      <div>
                        <Label htmlFor="password">Mật khẩu *</Label>
                        <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mật khẩu tạm thời" />
                      </div>
                      <div>
                        <Label htmlFor="stationId" className="text-sm font-medium text-gray-700 mb-2 block">Trạm làm việc (tùy chọn)</Label>
                        <select
                          id="stationId"
                          value={formData.stationId}
                          onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm font-medium
                          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                          hover:border-gray-300 transition-all duration-200 cursor-pointer
                          shadow-sm hover:shadow-md"
                        >
                          <option value="">-- Không phân công trạm --</option>
                          {stationsData
                            .filter(st => st.stationId !== null)
                            .map((station, index) => (
                              <option key={`add-station-${station.stationId}-${index}`} value={station.stationId}>
                                Trạm {station.stationId} - {station.stationName}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                      <Button onClick={handleAddStaff} disabled={!!loading.add}>{loading.add ? "Đang tạo..." : "Thêm nhân viên"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm theo tên, email hoặc mã nhân viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap text-gray-700">Trạng thái:</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm font-medium min-w-[160px] 
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                    hover:border-gray-300 transition-all duration-200 cursor-pointer
                    shadow-sm hover:shadow-md"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Hiển thị <strong className="text-foreground">{filteredStaffList.length}</strong> / {staffList.length} nhân viên</span>
              </div>
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
                {filteredStaffList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy nhân viên phù hợp với bộ lọc"
                          : "Chưa có nhân viên nào"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaffList.map((s, index) => {
                    const isBusy = !!loading[s.staffId];
                    const stationName = s.stationName || (s.stationId ? String(s.stationId) : null);
                    return (
                      <TableRow key={`staff-${s.staffId}-${index}`}>
                        <TableCell>{s.staffId}</TableCell>
                        <TableCell className="font-medium">{s.fullName}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>
                          {stationName ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-blue-500" /> {stationName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Chưa phân công</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.stationId ? "default" : "secondary"}>{s.stationId ? "Hoạt động" : "Không hoạt động"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedStaff(s); setFormData({ name: s.fullName, email: s.email, password: "", stationId: s.stationId ?? "" }); setIsEditDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            {s.stationId ? (
                              <Button size="sm" variant="outline" onClick={() => handleUnassignStaff(s.staffId)} disabled={isBusy}>
                                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hủy assign"}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => { setSelectedStaff(s); setAssignStationId(""); setIsAssignDialogOpen(true); }} disabled={isBusy}>
                                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit dialog (UI only) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>Cập nhật thông tin (demo UI)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Họ và tên</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
              <Button onClick={() => { toast.success("Cập nhật (UI)"); setIsEditDialogOpen(false); }}>Cập nhật</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phân công nhân viên vào trạm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assign-station" className="text-sm font-medium text-gray-700 mb-2 block">Chọn trạm:</Label>
                <select
                  id="assign-station"
                  value={assignStationId}
                  onChange={(e) => setAssignStationId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  hover:border-gray-300 transition-all duration-200 cursor-pointer
                  shadow-sm hover:shadow-md"
                >
                  <option value="">-- Chọn trạm --</option>
                  {stationsData.map((station, index) => (
                    <option key={`assign-station-${station.stationId}-${index}`} value={Number(station.stationId)}>
                      Trạm {station.stationId} - {station.stationName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleAssignConfirm}>Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffManagement;
