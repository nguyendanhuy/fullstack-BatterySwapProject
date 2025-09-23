import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ArrowLeft, AlertTriangle, CheckCircle, Wrench, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

    return (
      <div className="space-y-4">
        <div className="bg-electric-blue-light p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Thông tin pin: {battery.id}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>Loại: {battery.type}</span>
            <span>SoH hiện tại: {battery.soh}</span>
            <span>Chu kỳ: {battery.cycles}</span>
            <span>Vị trí: {battery.location}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="physical">Tình trạng vật lý</Label>
            <Textarea
              id="physical"
              placeholder="Mô tả tình trạng vật lý của pin..."
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú về pin</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm về pin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <Label>Người thực hiện kiểm tra</Label>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger>
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
            className="flex-1"
            onClick={handleSubmit}
            disabled={!physicalCondition || !notes || !inspector}
          >
            Hoàn thành kiểm tra
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={handleSendMaintenance}
            disabled={!inspector}
          >
            Gửi bảo trì
          </Button>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Search className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Kiểm tra/Giám định pin</h1>
          </div>
          <Link to="/staff">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle>Pin cần kiểm tra</CardTitle>
            <CardDescription>
              Danh sách pin cần được kiểm tra tình trạng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emptyBatteries.map((battery) => (
                <div key={battery.id} className="border rounded-lg p-4 hover-glow">
                  <div className="grid lg:grid-cols-4 gap-4 items-center">
                    <div>
                      <h3 className="font-semibold text-electric-blue">{battery.id}</h3>
                      <p className="text-sm text-muted-foreground">{battery.type}</p>
                      <p className="text-sm text-muted-foreground">Vị trí: {battery.location}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>SoH:</span>
                        <span className={`font-medium ${
                          parseInt(battery.soh) > 90 ? 'text-success' : 
                          parseInt(battery.soh) > 80 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {battery.soh}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Chu kỳ:</span>
                        <span>{battery.cycles}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Sử dụng cuối: {battery.lastUsed}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedBattery(battery);
                            }}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Kiểm tra pin
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Kiểm tra pin</DialogTitle>
                            <DialogDescription>
                              Thực hiện kiểm tra tình trạng pin
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspection History */}
        <Card className="mb-6 animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lịch sử kiểm tra pin</CardTitle>
                <CardDescription>
                  {showFullHistory ? "Lịch sử tổng hợp tất cả pin đã kiểm tra" : "Danh sách pin đã được kiểm tra gần đây"}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFullHistory(!showFullHistory)}
              >
                {showFullHistory ? "Thu gọn" : "Xem lịch sử tổng hợp"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="grid lg:grid-cols-5 gap-4 items-center">
                    <div>
                      <h3 className="font-semibold text-electric-blue">{record.id}</h3>
                      <p className="text-sm text-muted-foreground">{record.type}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {record.inspectionDate}
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-1" />
                        {record.inspector}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Tình trạng vật lý:</p>
                      <p className="text-sm text-muted-foreground">{record.physicalCondition}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Ghi chú:</p>
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
                    </div>
                    
                    <div>
                      <Badge variant={record.status === "Đạt chuẩn" ? "default" : "destructive"}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Summary */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Thống kê kiểm tra hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-2" />
                <h3 className="text-2xl font-bold">3</h3>
                <p className="text-muted-foreground">Cần kiểm tra</p>
              </div>
              <div>
                <Wrench className="h-12 w-12 text-destructive mx-auto mb-2" />
                <h3 className="text-2xl font-bold">2</h3>
                <p className="text-muted-foreground">Gửi bảo trì</p>
              </div>
              <div>
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                <h3 className="text-2xl font-bold">8</h3>
                <p className="text-muted-foreground">Đạt chuẩn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BatteryInspection;