import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, UserPlus, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { getAllStaff } from "../../services/axios.services";
const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [stations] = useState([
    { id: 1, name: "Trạm Bình Thạnh", address: "789 Xô Viết Nghệ Tĩnh", currentStaff: 2, maxStaff: 2 },
    { id: 2, name: "Trạm Quận 1", address: "123 Lê Lợi", currentStaff: 1, maxStaff: 2 },
    { id: 3, name: "Trạm Thủ Đức", address: "456 Võ Văn Ngân", currentStaff: 1, maxStaff: 2 },
    { id: 4, name: "Trạm Tân Bình", address: "321 Cộng Hòa", currentStaff: 0, maxStaff: 2 },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [assignData, setAssignData] = useState({
    staffId: 0,
    stationId: "",
    email: "",
  });
  const totalStaff = staffList.length;
  const assignedStaff = staffList.filter(staff => staff.stationId).length;
  const unassignedStaff = totalStaff - assignedStaff;
  useEffect(() => {
    // Fetch staff data from the server
    const fetchStaffData = async () => {
      try {
        const response = await getAllStaff();
        setStaffList(response);
        console.log("✅Fetched staff data:", response);
      } catch (error) {
        console.error("❌Error fetching staff data:", error);
      }
    };
    fetchStaffData();
  }, []);
  const handleAddStaff = () => {
    if (formData.name && formData.email && formData.phone) {
      const newStaff = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        station: null,
        status: "inactive"
      };
      setStaffList([...staffList, newStaff]);
      setFormData({ name: "", email: "", phone: "" });
      setIsAddDialogOpen(false);
    }
  };
  const handleEditStaff = () => {
    if (selectedStaff && formData.name && formData.email && formData.phone) {
      const updatedStaff = staffList.map(staff => staff.id === selectedStaff.id
        ? { ...staff, name: formData.name, email: formData.email, phone: formData.phone }
        : staff);
      setStaffList(updatedStaff);
      setFormData({ name: "", email: "", phone: "" });
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
    }
  };
  const handleDeleteStaff = () => {
    if (selectedStaff) {
      setStaffList(staffList.filter(staff => staff.id !== selectedStaff.id));
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
    }
  };
  const handleAssignStaff = () => {
    if (assignData.staffId && assignData.stationId && assignData.email) {
      const selectedStation = stations.find(station => station.id.toString() === assignData.stationId);
      const updatedStaff = staffList.map(staff => staff.id === assignData.staffId
        ? { ...staff, station: selectedStation?.name || null, status: "active", email: assignData.email }
        : staff);
      setStaffList(updatedStaff);
      setAssignData({ staffId: 0, stationId: "", email: "" });
      setIsAssignDialogOpen(false);
    }
  };
  const handleUnassignStaff = (staffId) => {
    const updatedStaff = staffList.map(staff => staff.id === staffId
      ? { ...staff, station: null, status: "inactive" }
      : staff);
    setStaffList(updatedStaff);
  };
  const openEditDialog = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
    });
    setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };
  const openAssignDialog = (staff) => {
    setAssignData({
      staffId: staff.id,
      stationId: "",
      email: staff.email,
    });
    setIsAssignDialogOpen(true);
  };
  return (<div className="min-h-screen bg-background">
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

      {/* Station Status Overview */}
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
              const stationStaffCount = staffList.filter(staff => staff.stationName === station.name).length;
              const isFullyStaffed = stationStaffCount >= station.maxStaff;
              const isEmpty = stationStaffCount === 0;
              return (
                <Card
                  key={station.id}
                  className={`border-l-4 transition-all duration-300 hover:scale-105 ${isEmpty ? 'border-l-red-500 bg-red-50' :
                    isFullyStaffed ? 'border-l-green-500 bg-green-50' :
                      'border-l-yellow-500 bg-yellow-50'
                    }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{station.name}</h3>
                        <Badge
                          variant={
                            isEmpty ? "destructive" :
                              isFullyStaffed ? "default" :
                                "secondary"
                          }
                        >
                          {stationStaffCount}/{station.maxStaff}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{station.address}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Nhân viên:</span>
                          <span
                            className={`font-medium ${isEmpty ? 'text-red-600' :
                              isFullyStaffed ? 'text-green-600' :
                                'text-yellow-600'
                              }`}
                          >
                            {stationStaffCount}/{station.maxStaff}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${isEmpty ? 'bg-red-500' :
                              isFullyStaffed ? 'bg-green-500' :
                                'bg-yellow-500'
                              }`}
                            style={{ width: `${(stationStaffCount / station.maxStaff) * 100}%` }}
                          ></div>
                        </div>
                        <div className="space-y-1">
                          {staffList
                            .filter(staff => staff.stationName === station.name)
                            .map(staff => (
                              <div key={staff.userId || staff.id} className="flex items-center text-xs text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                {staff.fullName}
                              </div>
                            ))}
                          {stationStaffCount === 0 && (
                            <div className="text-xs text-gray-500 italic">Chưa có thông tin</div>
                          )}
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
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập họ và tên" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Nhập số điện thoại" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleAddStaff}>Thêm nhân viên</Button>
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
              {staffList.map((staff) => (
                <TableRow key={staff.staffId}>
                  <TableCell>{staff.staffId}</TableCell>
                  <TableCell className="font-medium">{staff.fullName}</TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>
                    {staff.stationId ? (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-electric-blue" />
                        {staff.stationId} - {staff.stationName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Chưa phân công</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.stationId ? "default" : "secondary"}>
                      {staff.stationId ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(staff)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDeleteDialog(staff)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {staff.station ? (
                        <Button size="sm" variant="outline" onClick={() => handleUnassignStaff(staff.id)}>
                          Hủy assign
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => openAssignDialog(staff)}>
                          Assign
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditStaff}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa nhân viên</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên "{selectedStaff?.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff}>
              Xóa nhân viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân công nhân viên vào trạm</DialogTitle>
            <DialogDescription>Chọn trạm và cấp tài khoản cho nhân viên</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="station">Chọn trạm</Label>
              <Select value={assignData.stationId} onValueChange={(value) => setAssignData({ ...assignData, stationId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạm làm việc" />
                </SelectTrigger>
                <SelectContent>
                  {stations
                    .filter(station => station.currentStaff < station.maxStaff)
                    .map((station) => (
                      <SelectItem key={station.id} value={station.id.toString()}>
                        {station.name} ({station.currentStaff}/{station.maxStaff})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-email">Email tài khoản</Label>
              <Input id="assign-email" type="email" value={assignData.email} onChange={(e) => setAssignData({ ...assignData, email: e.target.value })} placeholder="Nhập email để tạo tài khoản" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAssignStaff}>Assign và tạo tài khoản</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>);
};
export default StaffManagement;
