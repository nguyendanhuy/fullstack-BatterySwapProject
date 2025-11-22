import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Upload, ArrowLeft, Search, Filter, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getAllVehicles, importVehiclesCSV } from "@/services/axios.services"

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedBatteryType, setSelectedBatteryType] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(""); // "", "hasOwner", "noOwner"

  useEffect(() => {
    const fetchVehicles = async () => {
      const vehicleRes = await getAllVehicles();
      console.log("vehicleRes", vehicleRes);
      if (vehicleRes.success) {
        setVehicles(vehicleRes.vehicles.sort((a, b) => {
          // Sort theo loại xe trước
          const typeCompare = a.vehicleType.localeCompare(b.vehicleType);
          if (typeCompare !== 0) return typeCompare;

          // Nếu cùng loại xe, sort theo ID
          return a.vehicleId - b.vehicleId;
        }));
      } else {
        toast.error("Lỗi khi tải danh sách xe");
      }
    };
    fetchVehicles();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast.error("Vui lòng chọn file CSV");
      return;
    }

    try {
      const response = await importVehiclesCSV(file);
      console.log("Import response:", response);

      if (response.failureCount === 0) {
        toast.success(`Đã import ${response.successCount || 0} xe thành công`);
        const vehicleRes = await getAllVehicles();
        if (vehicleRes.success) {
          setVehicles(vehicleRes.vehicles.sort((a, b) => {
            const typeCompare = a.vehicleType.localeCompare(b.vehicleType);
            if (typeCompare !== 0) return typeCompare;
            return a.vehicleId - b.vehicleId;
          }));
        }
      } else {
        const errorMessages = response?.errors.map(error =>
          `• Biển số ${error.licensePlate}: ${error.errors[0]}`
        ).join("\n");

        toast.error(
          <div>
            <div className="font-semibold mb-2">
              Import thất bại {response.failureCount} xe:
            </div>
            <div className="text-sm whitespace-pre-line">
              {errorMessages}
            </div>
          </div>,
          { duration: 10000 }
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Lỗi khi import file CSV");
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const search = searchTerm.toLowerCase();
    const matchSearch = (
      vehicle.licensePlate.toLowerCase().includes(search) ||
      vehicle.vin.toLowerCase().includes(search) ||
      vehicle.ownerName.toLowerCase().includes(search) ||
      vehicle.vehicleType.toLowerCase().includes(search)
    );

    const matchVehicleType = selectedVehicleType === "" || vehicle.vehicleType === selectedVehicleType;
    const matchBatteryType = selectedBatteryType === "" || vehicle.batteryType === selectedBatteryType;

    let matchOwner = true;
    if (ownerFilter === "hasOwner") {
      matchOwner = !!vehicle.userId;
    } else if (ownerFilter === "noOwner") {
      matchOwner = !vehicle.userId;
    }

    return matchSearch && matchVehicleType && matchBatteryType && matchOwner;
  });

  // Lấy danh sách loại pin unique
  const batteryTypes = [...new Set(vehicles.map(v => v.batteryType))];

  const getBatteryTypeBadge = (batteryType) => {
    const colors = [
      "bg-blue-500 text-white hover:bg-blue-600",
      "bg-green-500 text-white hover:bg-green-600",
      "bg-yellow-500 text-white hover:bg-yellow-600",
      "bg-purple-500 text-white hover:bg-purple-600",
      "bg-pink-500 text-white hover:bg-pink-600",
      "bg-indigo-500 text-white hover:bg-indigo-600"
    ];

    const index = batteryTypes.indexOf(batteryType);
    return index >= 0 && index <= 5 ? colors[index] : "bg-gray-500 text-white hover:bg-gray-600";
  };

  // Lấy danh sách loại xe unique
  const vehicleTypes = [...new Set(vehicles.map(v => v.vehicleType))];

  const getVehicleTypeBadge = (vehicleType) => {
    const colors = [
      "bg-cyan-500 text-white hover:bg-cyan-600",
      "bg-emerald-500 text-white hover:bg-emerald-600",
      "bg-amber-500 text-white hover:bg-amber-600",
      "bg-violet-500 text-white hover:bg-violet-600",
      "bg-rose-500 text-white hover:bg-rose-600",
      "bg-teal-500 text-white hover:bg-teal-600"
    ];

    const index = vehicleTypes.indexOf(vehicleType);
    return index >= 0 && index <= 5 ? colors[index] : "bg-slate-500 text-white hover:bg-slate-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Quản lý Xe</h1>
              <p className="text-purple-100 text-sm">
                Xem và quản lý danh sách xe trong hệ thống
              </p>
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
        {/* Stats and Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{vehicles.length}</h3>
              <p className="text-gray-600 text-sm">Tổng số xe</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">
                {vehicles.filter(v => v.isActive).length}
              </h3>
              <p className="text-gray-600 text-sm">Xe hoạt động</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">
                {vehicles.filter(v => !v.isActive).length}
              </h3>
              <p className="text-gray-600 text-sm">Xe không hoạt động</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-full"
                  asChild
                >
                  <div className="cursor-pointer flex flex-col items-center justify-center py-4">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Import CSV</span>
                    <span className="text-xs text-white/80 mt-1">Tải lên danh sách xe</span>
                  </div>
                </Button>
              </label>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Info className="h-4 w-4 mr-2" />
                    Hướng dẫn CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Hướng dẫn Import Xe từ File CSV</DialogTitle>
                    <DialogDescription>
                      Format và điều kiện validate cho file CSV
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Format CSV:</h3>
                      <code className="block bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        VIN,vehicleType,batteryType,ownerName,licensePlate,color,batteryCount,manufactureDate,purchaseDate,battery_ids
                      </code>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Các trường bắt buộc:</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          <strong>VIN:</strong> Mã VIN 17 ký tự (chỉ chữ in hoa A-Z trừ I,O,Q và số 0-9)
                          <br />
                          <span className="text-muted-foreground ml-5">Ví dụ: LFVTH1A10N0000337</span>
                        </li>
                        <li>
                          <strong>vehicleType:</strong> Loại xe (FELIZ, KLARA_S ...)
                        </li>
                        <li>
                          <strong>batteryType:</strong> Loại pin (LITHIUM_ION, LEAD_ACID, ...)
                        </li>
                        <li>
                          <strong>batteryCount:</strong> Số lượng pin (≥ 1)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Các trường tùy chọn:</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          <strong>ownerName:</strong> Tên chủ xe
                        </li>
                        <li>
                          <strong>licensePlate:</strong> Biển số xe (không được trùng)
                        </li>
                        <li>
                          <strong>color:</strong> Màu sắc xe
                        </li>
                        <li>
                          <strong>manufactureDate:</strong> Ngày sản xuất
                          <br />
                          <span className="text-muted-foreground ml-5">Format: YYYY-MM-DD, DD/MM/YYYY, hoặc DD-MM-YYYY</span>
                        </li>
                        <li>
                          <strong>purchaseDate:</strong> Ngày mua
                          <br />
                          <span className="text-muted-foreground ml-5">Format: YYYY-MM-DD, DD/MM/YYYY, hoặc DD-MM-YYYY</span>
                        </li>
                        <li>
                          <strong>battery_ids:</strong> Danh sách ID pin (cách nhau bởi dấu , hoặc ;)
                          <br />
                          <span className="text-muted-foreground ml-5">Nếu có thì số lượng phải khớp với batteryCount và các ID phải tồn tại</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Ví dụ CSV hợp lệ:</h3>
                      <code className="block bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre">
                        {`VIN,vehicleType,batteryType,ownerName,licensePlate,color,batteryCount,manufactureDate,purchaseDate
LFVTH1A10N0000337,VENTO,LITHIUM_ION,Nguyễn Văn A,29B1-12345,Đỏ,2,2023-05-15,15/06/2023
LFVTH1A10N0000338,KLARA,LEAD_ACID,Trần Thị B,30C2-23456,Xanh,1,2023-06-20,`}
                      </code>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Lưu ý:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                        <li>VIN và biển số xe phải là duy nhất (không trùng với xe đã có)</li>
                        <li>File phải có định dạng .csv</li>
                        <li>Dòng đầu tiên là header (tên cột)</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tìm kiếm và lọc xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo biển số, VIN, chủ xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Tất cả loại xe</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedBatteryType}
                onChange={(e) => setSelectedBatteryType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Tất cả loại pin</option>
                {batteryTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Tất cả xe</option>
                <option value="hasOwner">Xe có chủ ({vehicles.filter(v => v.userId).length})</option>
                <option value="noOwner">Xe chưa có chủ ({vehicles.filter(v => !v.userId).length})</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách xe ({filteredVehicles.length})</CardTitle>
            <CardDescription>
              Tất cả xe đã đăng ký trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Biển số</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Loại xe</TableHead>
                    <TableHead>Màu sắc</TableHead>
                    <TableHead>Chủ xe</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Loại pin</TableHead>
                    <TableHead>Số pin</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.vehicleId}>
                      <TableCell className="font-medium">
                        {vehicle.vehicleId}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {vehicle.licensePlate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {vehicle.vin}
                      </TableCell>
                      <TableCell>
                        <Badge className={getVehicleTypeBadge(vehicle.vehicleType)}>
                          {vehicle.vehicleType}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehicle.color}</TableCell>
                      <TableCell className="font-medium">
                        {vehicle.ownerName}
                      </TableCell>
                      <TableCell>
                        {vehicle.userId ? (
                          <span className="text-sm">{vehicle.userId}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getBatteryTypeBadge(vehicle.batteryType)}>
                          {vehicle.batteryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {vehicle.batteryCount}
                      </TableCell>
                      <TableCell>
                        {vehicle.isActive ? (
                          <Badge className="bg-green-500">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Không hoạt động</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleManagement;
