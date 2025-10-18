import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Battery, ArrowLeft, Search, Edit, Trash, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
const BatteryInventory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBattery, setEditingBattery] = useState(null);
  // Form states for adding battery
  const [newBattery, setNewBattery] = useState({
    id: "",
    type: "",
    status: "empty",
    soh: "100",
    location: ""
  });
  // Form states for editing battery
  const [editBattery, setEditBattery] = useState({
    id: "",
    type: "",
    status: "",
    soh: "",
    location: ""
  });
  const batteries = [
    {
      id: "BAT001",
      type: "Lithium-ion",
      status: "full",
      soh: "95%",
      location: "Slot A1",
      lastUpdated: "15/12/2024 10:30"
    },
    {
      id: "BAT002",
      type: "Pin LFP",
      status: "charging",
      soh: "92%",
      location: "Slot A2",
      lastUpdated: "15/12/2024 09:15"
    },
    {
      id: "BAT003",
      type: "Lithium-ion",
      status: "empty",
      soh: "88%",
      location: "Slot A3",
      lastUpdated: "15/12/2024 14:45"
    },
    {
      id: "BAT004",
      type: "Pin LFP",
      status: "full",
      soh: "97%",
      location: "Slot B1",
      lastUpdated: "15/12/2024 11:20"
    },
    {
      id: "BAT005",
      type: "Lithium-ion",
      status: "charging",
      soh: "91%",
      location: "Slot B2",
      lastUpdated: "15/12/2024 13:10"
    }
  ];
  const getStatusBadge = (status) => {
    switch (status) {
      case "full":
        return <Badge className="bg-success text-white">Pin đầy</Badge>;
      case "charging":
        return <Badge className="bg-charging text-white">Đang sạc</Badge>;
      case "empty":
        return <Badge variant="secondary">Pin đang bảo trì</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };
  const statusCounts = {
    full: batteries.filter(b => b.status === "full").length,
    charging: batteries.filter(b => b.status === "charging").length,
    empty: batteries.filter(b => b.status === "empty").length
  };
  const handleAddBattery = () => {
    toast({
      title: "Thêm pin thành công",
      description: `Pin ${newBattery.id} đã được thêm vào kho`,
    });
    setNewBattery({ id: "", type: "", status: "empty", soh: "100", location: "" });
    setIsAddDialogOpen(false);
  };
  const handleEditBattery = (battery) => {
    setEditingBattery(battery);
    setEditBattery({
      id: battery.id,
      type: battery.type,
      status: battery.status,
      soh: battery.soh.replace('%', ''),
      location: battery.location
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdateBattery = () => {
    toast({
      title: "Cập nhật pin thành công",
      description: `Thông tin pin ${editBattery.id} đã được cập nhật`,
    });
    setIsEditDialogOpen(false);
  };
  return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* Enhanced Header */}
    <header className="bg-white dark:bg-slate-900 border-b">
      <div className="container mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold text-foreground">Quản lý pin</h1>
      </div>
    </header>

    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mx-auto mb-4 w-fit">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">{statusCounts.full}</h3>
            <p className="text-gray-600 font-medium">Pin đầy</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mx-auto mb-4 w-fit">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">{statusCounts.charging}</h3>
            <p className="text-gray-600 font-medium">Đang sạc</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl mx-auto mb-4 w-fit">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">{statusCounts.empty}</h3>
            <p className="text-gray-600 font-medium">Bảo trì</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 w-fit">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">{batteries.length}</h3>
            <p className="text-gray-600 font-medium">Tổng số</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Actions */}
      <Card className="mb-6 border-0 shadow-lg bg-white animate-slide-up">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Tìm theo mã pin, loại pin..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
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
              </SelectContent>
            </Select>

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
                    Nhập thông tin chi tiết của pin mới để thêm vào kho
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="battery-id">Mã pin</Label>
                    <Input id="battery-id" value={newBattery.id} onChange={(e) => setNewBattery({ ...newBattery, id: e.target.value })} placeholder="BAT006" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="battery-type">Loại pin</Label>
                    <Select value={newBattery.type} onValueChange={(value) => setNewBattery({ ...newBattery, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại pin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lithium-ion">Lithium-ion</SelectItem>
                        <SelectItem value="Pin LFP">Pin LFP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="battery-status">Trạng thái</Label>
                    <Select value={newBattery.status} onValueChange={(value) => setNewBattery({ ...newBattery, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Pin đầy</SelectItem>
                        <SelectItem value="charging">Đang sạc</SelectItem>
                        <SelectItem value="empty">Bảo trì</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="battery-soh">SoH (%)</Label>
                      <Input id="battery-soh" type="number" value={newBattery.soh} onChange={(e) => setNewBattery({ ...newBattery, soh: e.target.value })} placeholder="100" min="0" max="100" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="battery-location">Vị trí</Label>
                      <Input id="battery-location" value={newBattery.location} onChange={(e) => setNewBattery({ ...newBattery, location: e.target.value })} placeholder="Slot C1" />
                    </div>
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

      {/* Enhanced Battery Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Danh sách pin
            <span className="text-lg font-normal text-gray-500 ml-2">({batteries.length} pin)</span>
          </h2>
        </div>

        <div className="grid gap-6">
          {batteries.map((battery, index) => (<Card key={battery.id} className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-800">{battery.id}</h3>
                  <p className="text-sm text-gray-600">{battery.type}</p>
                </div>

                <div className="flex justify-start">
                  {getStatusBadge(battery.status)}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">SoH</p>
                  <p className={`font-semibold ${parseInt(battery.soh) > 90 ? 'text-green-600' :
                    parseInt(battery.soh) > 80 ? 'text-orange-500' : 'text-red-500'}`}>
                    {battery.soh}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Vị trí</p>
                  <p className="text-sm font-medium text-gray-700">{battery.location}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Cập nhật</p>
                  <p className="text-xs text-gray-500">{battery.lastUpdated}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditBattery(battery)} className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>))}
        </div>
      </div>
    </div>

    {/* Modern Edit Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin pin</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin chi tiết của pin {editBattery.id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-battery-id">Mã pin</Label>
            <Input id="edit-battery-id" value={editBattery.id} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-battery-type">Loại pin</Label>
            <Select value={editBattery.type} onValueChange={(value) => setEditBattery({ ...editBattery, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lithium-ion">Lithium-ion</SelectItem>
                <SelectItem value="Pin LFP">Pin LFP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-battery-status">Trạng thái</Label>
            <Select value={editBattery.status} onValueChange={(value) => setEditBattery({ ...editBattery, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Pin đầy</SelectItem>
                <SelectItem value="charging">Đang sạc</SelectItem>
                <SelectItem value="empty">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-battery-soh">SoH (%)</Label>
              <Input id="edit-battery-soh" type="number" value={editBattery.soh} onChange={(e) => setEditBattery({ ...editBattery, soh: e.target.value })} min="0" max="100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-battery-location">Vị trí</Label>
              <Input id="edit-battery-location" value={editBattery.location} onChange={(e) => setEditBattery({ ...editBattery, location: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpdateBattery} className="flex-1">Cập nhật</Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>);
};
export default BatteryInventory;
