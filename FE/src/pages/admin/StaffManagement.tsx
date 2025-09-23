import { useState } from "react";
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

interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  station: string | null;
  status: "active" | "inactive";
}

interface Station {
  id: number;
  name: string;
  address: string;
  currentStaff: number;
  maxStaff: number;
}

const StaffManagement = () => {
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: 1, name: "Nguyễn Văn A", email: "nva@company.com", phone: "0901234567", station: "Trạm Bình Thạnh", status: "active" },
    { id: 2, name: "Trần Thị B", email: "ttb@company.com", phone: "0901234568", station: "Trạm Thủ Đức", status: "active" },
    { id: 3, name: "Lê Văn C", email: "lvc@company.com", phone: "0901234569", station: "Trạm Bình Thạnh", status: "active" },
    { id: 4, name: "Phạm Thị D", email: "ptd@company.com", phone: "0901234570", station: null, status: "inactive" },
    { id: 5, name: "Hoàng Văn E", email: "hve@company.com", phone: "0901234571", station: "Trạm Quận 1", status: "active" },
  ]);

  const [stations] = useState<Station[]>([
    { id: 1, name: "Trạm Bình Thạnh", address: "789 Xô Viết Nghệ Tĩnh", currentStaff: 2, maxStaff: 2 },
    { id: 2, name: "Trạm Quận 1", address: "123 Lê Lợi", currentStaff: 1, maxStaff: 2 },
    { id: 3, name: "Trạm Thủ Đức", address: "456 Võ Văn Ngân", currentStaff: 1, maxStaff: 2 },
    { id: 4, name: "Trạm Tân Bình", address: "321 Cộng Hòa", currentStaff: 0, maxStaff: 2 },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

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
  const assignedStaff = staffList.filter(staff => staff.station).length;
  const unassignedStaff = totalStaff - assignedStaff;

  const handleAddStaff = () => {
    if (formData.name && formData.email && formData.phone) {
      const newStaff: Staff = {
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
      const updatedStaff = staffList.map(staff =>
        staff.id === selectedStaff.id
          ? { ...staff, name: formData.name, email: formData.email, phone: formData.phone }
          : staff
      );
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
      const updatedStaff = staffList.map(staff =>
        staff.id === assignData.staffId
          ? { ...staff, station: selectedStation?.name || null, status: "active" as const, email: assignData.email }
          : staff
      );
      setStaffList(updatedStaff);
      setAssignData({ staffId: 0, stationId: "", email: "" });
      setIsAssignDialogOpen(false);
    }
  };

  const handleUnassignStaff = (staffId: number) => {
    const updatedStaff = staffList.map(staff =>
      staff.id === staffId
        ? { ...staff, station: null, status: "inactive" as const }
        : staff
    );
    setStaffList(updatedStaff);
  };

  const openEditDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const openAssignDialog = (staff: Staff) => {
    setAssignData({
      staffId: staff.id,
      stationId: "",
      email: staff.email,
    });
    setIsAssignDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Quản lý nhân viên</h1>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-electric-blue mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{totalStaff}</h3>
              <p className="text-muted-foreground">Tổng nhân viên</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <UserPlus className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{assignedStaff}</h3>
              <p className="text-muted-foreground">Đã phân công</p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-2xl font-bold">{unassignedStaff}</h3>
              <p className="text-muted-foreground">Chưa phân công</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách nhân viên</CardTitle>
                <CardDescription>Quản lý tất cả nhân viên trong hệ thống</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Nhập số điện thoại"
                      />
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
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Trạm làm việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.phone}</TableCell>
                    <TableCell>
                      {staff.station ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-electric-blue" />
                          {staff.station}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa phân công</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                        {staff.status === "active" ? "Hoạt động" : "Không hoạt động"}
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
              <div>
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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
                <Input
                  id="assign-email"
                  type="email"
                  value={assignData.email}
                  onChange={(e) => setAssignData({ ...assignData, email: e.target.value })}
                  placeholder="Nhập email để tạo tài khoản"
                />
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
    </div>
  );
};

export default StaffManagement;