import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import {
    Clock,
    Search,
    CheckCircle,
    XCircle,
    Plus,
    Eye,
    AlertTriangle,
    Battery,
    User,
    Phone,
    MapPin,
    Calendar,
    FileText,
    Edit,
    Ban,
    Check,
    Image as ImageIcon
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock Data (JSX: không cần kiểu)
const mockDisputes = [
    {
        id: "1",
        ticketNumber: "DSP-2024-001",
        customerId: "CUST-001",
        customerName: "Nguyễn Văn An",
        customerPhone: "0901234567",
        batteryId: "BAT-003",
        batteryLocation: "A3",
        dockId: 1,
        type: "low_soh",
        typeLabel: "SoH quá thấp",
        status: "investigating",
        priority: "high",
        description:
            "Pin sụt điện rất nhanh, chỉ chạy được 10km dù báo 80%. Nghi ngờ SoH thực tế thấp hơn hiển thị. Yêu cầu kiểm tra và đổi pin mới.",
        reportedDate: "15/12/2024 14:30",
        assignedTo: "Nhân viên Trần B",
        batteryType: "Lithium-ion 48V 20Ah",
        currentSoh: "62%",
        chargeLevel: 45,
        lastSwapDate: "14/12/2024 10:15",
        images: ["/placeholder.svg"],
        history: [
            { timestamp: "15/12/2024 14:30", action: "Phiếu được tạo", performer: "Nguyễn Văn An" },
            { timestamp: "15/12/2024 14:35", action: "Nhân viên nhận xử lý", performer: "Trần B" },
            {
                timestamp: "15/12/2024 15:00",
                action: "Bắt đầu kiểm tra pin",
                performer: "Trần B",
                note: "Pin được mang về kho để kiểm tra chi tiết"
            }
        ]
    },
    {
        id: "2",
        ticketNumber: "DSP-2024-002",
        customerId: "CUST-002",
        customerName: "Trần Thị Bình",
        customerPhone: "0912345678",
        batteryId: "BAT-007",
        batteryLocation: "B2",
        dockId: 1,
        type: "defective",
        typeLabel: "Pin hư hỏng",
        status: "pending",
        priority: "urgent",
        description: "Pin phát ra tiếng kêu lạ và nóng bất thường khi sạc. Rất nguy hiểm, cần xử lý ngay.",
        reportedDate: "15/12/2024 16:45",
        batteryType: "Lithium-ion 60V 24Ah",
        currentSoh: "78%",
        chargeLevel: 35,
        lastSwapDate: "15/12/2024 09:30",
        images: ["/placeholder.svg", "/placeholder.svg"],
        history: [{ timestamp: "15/12/2024 16:45", action: "Phiếu được tạo", performer: "Trần Thị Bình" }]
    },
    {
        id: "3",
        ticketNumber: "DSP-2024-003",
        customerId: "CUST-003",
        customerName: "Lê Văn Cường",
        customerPhone: "0923456789",
        batteryId: "BAT-012",
        batteryLocation: "C1",
        dockId: 2,
        type: "not_charging",
        typeLabel: "Không sạc được",
        status: "resolved",
        priority: "medium",
        description: "Pin không nhận sạc, đã thử nhiều cổng sạc khác nhau nhưng đều không được.",
        reportedDate: "14/12/2024 10:20",
        assignedTo: "Nhân viên Phạm D",
        batteryType: "Lithium-ion 48V 20Ah",
        currentSoh: "85%",
        chargeLevel: 15,
        lastSwapDate: "14/12/2024 08:00",
        resolution: "Đã thay thế pin mới cho khách hàng. Pin cũ được chuyển về bảo trì.",
        resolvedDate: "14/12/2024 15:30",
        compensationType: "replacement",
        history: [
            { timestamp: "14/12/2024 10:20", action: "Phiếu được tạo", performer: "Lê Văn Cường" },
            { timestamp: "14/12/2024 10:25", action: "Nhân viên nhận xử lý", performer: "Phạm D" },
            { timestamp: "14/12/2024 11:00", action: "Kiểm tra xác nhận lỗi", performer: "Phạm D", note: "Cổng sạc bị hỏng" },
            { timestamp: "14/12/2024 15:30", action: "Đã thay pin mới", performer: "Phạm D" }
        ]
    },
    {
        id: "4",
        ticketNumber: "DSP-2024-004",
        customerId: "CUST-004",
        customerName: "Phạm Thị Dung",
        customerPhone: "0934567890",
        batteryId: "BAT-015",
        batteryLocation: "A5",
        dockId: 1,
        type: "performance",
        typeLabel: "Hiệu suất kém",
        status: "rejected",
        priority: "low",
        description: "Pin hết nhanh hơn bình thường.",
        reportedDate: "13/12/2024 14:00",
        assignedTo: "Nhân viên Nguyễn E",
        batteryType: "Lithium-ion 48V 20Ah",
        currentSoh: "92%",
        chargeLevel: 88,
        lastSwapDate: "13/12/2024 08:30",
        resolution: "Sau kiểm tra, pin hoạt động bình thường. Khách hàng sử dụng xe ở chế độ công suất cao.",
        resolvedDate: "13/12/2024 16:45",
        compensationType: "none",
        history: [
            { timestamp: "13/12/2024 14:00", action: "Phiếu được tạo", performer: "Phạm Thị Dung" },
            { timestamp: "13/12/2024 14:10", action: "Nhân viên nhận xử lý", performer: "Nguyễn E" },
            { timestamp: "13/12/2024 15:30", action: "Kiểm tra pin", performer: "Nguyễn E", note: "Pin hoạt động tốt" },
            { timestamp: "13/12/2024 16:45", action: "Từ chối phiếu", performer: "Nguyễn E", note: "Không phải lỗi pin" }
        ]
    }
];

const DisputeManagement = () => {
    // States (JSX: bỏ kiểu)
    const [disputes, setDisputes] = useState(mockDisputes);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Processing form states
    const [processingStatus, setProcessingStatus] = useState("");
    const [processingNotes, setProcessingNotes] = useState("");
    const [compensationType, setCompensationType] = useState("");
    const [compensationAmount, setCompensationAmount] = useState("");

    // Stats computed values
    const statsData = useMemo(
        () => [
            {
                label: "Chờ xử lý",
                count: disputes.filter((d) => d.status === "pending").length,
                icon: Clock,
                color: "from-orange-500 to-yellow-500",
                bgColor: "from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20"
            },
            {
                label: "Đang điều tra",
                count: disputes.filter((d) => d.status === "investigating").length,
                icon: Search,
                color: "from-blue-500 to-indigo-500",
                bgColor: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
            },
            {
                label: "Đã giải quyết",
                count: disputes.filter((d) => d.status === "resolved").length,
                icon: CheckCircle,
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            },
            {
                label: "Từ chối",
                count: disputes.filter((d) => d.status === "rejected").length,
                icon: XCircle,
                color: "from-red-500 to-pink-500",
                bgColor: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
            }
        ],
        [disputes]
    );

    // Filtered disputes
    const filteredDisputes = useMemo(() => {
        return disputes.filter((dispute) => {
            const matchType = filterType === "all" || dispute.type === filterType;
            const matchStatus = filterStatus === "all" || dispute.status === filterStatus;
            const matchPriority = filterPriority === "all" || dispute.priority === filterPriority;
            const matchSearch =
                searchQuery === "" ||
                dispute.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dispute.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dispute.batteryId.toLowerCase().includes(searchQuery.toLowerCase());

            return matchType && matchStatus && matchPriority && matchSearch;
        });
    }, [disputes, filterType, filterStatus, filterPriority, searchQuery]);

    // Handlers
    const handleViewDetail = (dispute) => {
        setSelectedDispute(dispute);
        setProcessingStatus(dispute.status);
        setProcessingNotes(dispute.inspectionNotes || "");
        setCompensationType(dispute.compensationType || "");
        setCompensationAmount(dispute.compensationAmount ? String(dispute.compensationAmount) : "");
        setIsDetailOpen(true);
    };

    const handleUpdateStatus = () => {
        if (!selectedDispute) return;

        const updatedDisputes = disputes.map((d) =>
            d.id === selectedDispute.id
                ? {
                    ...d,
                    status: processingStatus,
                    inspectionNotes: processingNotes,
                    history: [
                        ...d.history,
                        {
                            timestamp: new Date().toLocaleString("vi-VN"),
                            action: `Cập nhật trạng thái: ${processingStatus}`,
                            performer: "Nhân viên hiện tại",
                            note: processingNotes
                        }
                    ]
                }
                : d
        );

        setDisputes(updatedDisputes);
        toast({
            title: "Cập nhật thành công",
            description: `Trạng thái phiếu ${selectedDispute.ticketNumber} đã được cập nhật`
        });
    };

    const handleResolve = () => {
        if (!selectedDispute) return;

        const updatedDisputes = disputes.map((d) =>
            d.id === selectedDispute.id
                ? {
                    ...d,
                    status: "resolved",
                    resolution: processingNotes,
                    resolvedDate: new Date().toLocaleString("vi-VN"),
                    compensationType: compensationType,
                    compensationAmount: parseFloat(compensationAmount) || 0,
                    history: [
                        ...d.history,
                        {
                            timestamp: new Date().toLocaleString("vi-VN"),
                            action: "Đã giải quyết phiếu",
                            performer: "Nhân viên hiện tại",
                            note: `Bồi thường: ${compensationType} - ${compensationAmount}đ`
                        }
                    ]
                }
                : d
        );

        setDisputes(updatedDisputes);
        setIsDetailOpen(false);
        toast({
            title: "Đã giải quyết phiếu tranh chấp",
            description: `Phiếu ${selectedDispute.ticketNumber} đã được xử lý thành công`
        });
    };

    const handleReject = () => {
        if (!selectedDispute || !processingNotes) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập lý do từ chối",
                variant: "destructive"
            });
            return;
        }

        const updatedDisputes = disputes.map((d) =>
            d.id === selectedDispute.id
                ? {
                    ...d,
                    status: "rejected",
                    resolution: processingNotes,
                    resolvedDate: new Date().toLocaleString("vi-VN"),
                    compensationType: "none",
                    history: [
                        ...d.history,
                        {
                            timestamp: new Date().toLocaleString("vi-VN"),
                            action: "Từ chối phiếu",
                            performer: "Nhân viên hiện tại",
                            note: processingNotes
                        }
                    ]
                }
                : d
        );

        setDisputes(updatedDisputes);
        setIsDetailOpen(false);
        toast({
            title: "Đã từ chối phiếu",
            description: `Phiếu ${selectedDispute.ticketNumber} đã được từ chối`
        });
    };

    // Helper badges
    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
            high: "bg-gradient-to-r from-orange-500 to-yellow-500 text-white",
            medium: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
            low: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        };
        const labels = { urgent: "Khẩn cấp", high: "Cao", medium: "Trung bình", low: "Thấp" };
        return <Badge className={styles[priority]}>{labels[priority]}</Badge>;
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-orange-500 text-white",
            investigating: "bg-blue-500 text-white",
            resolved: "bg-green-500 text-white",
            rejected: "bg-red-500 text-white"
        };
        const labels = {
            pending: "Chờ xử lý",
            investigating: "Đang điều tra",
            resolved: "Đã giải quyết",
            rejected: "Từ chối"
        };
        return <Badge className={styles[status]}>{labels[status]}</Badge>;
    };

    const getTypeBadge = (type) => {
        const styles = {
            defective: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            low_soh: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            not_charging: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            damage: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            performance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        };
        return (
            <Badge variant="outline" className={styles[type]}>
                {type}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Xử lý Phiếu Tranh Chấp</h2>
                    <p className="text-gray-600 dark:text-gray-400">Quản lý và giải quyết khiếu nại về pin từ khách hàng</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo phiếu mới
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {statsData.map((stat, index) => (
                    <Card key={index} className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgColor} hover:shadow-xl transition-all duration-300`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{stat.count}</h3>
                                </div>
                                <div className={`p-4 bg-gradient-to-br ${stat.color} rounded-xl`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="mb-6 border-0 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Loại tranh chấp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại</SelectItem>
                                <SelectItem value="defective">Pin hư hỏng</SelectItem>
                                <SelectItem value="low_soh">SoH quá thấp</SelectItem>
                                <SelectItem value="not_charging">Không sạc được</SelectItem>
                                <SelectItem value="damage">Pin bị hư hại</SelectItem>
                                <SelectItem value="performance">Hiệu suất kém</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="pending">Chờ xử lý</SelectItem>
                                <SelectItem value="investigating">Đang điều tra</SelectItem>
                                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                                <SelectItem value="rejected">Từ chối</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Độ ưu tiên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                                <SelectItem value="urgent">Khẩn cấp</SelectItem>
                                <SelectItem value="high">Cao</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="low">Thấp</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Tìm theo mã phiếu, tên khách, ID pin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dispute Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Danh sách phiếu tranh chấp
                    </CardTitle>
                    <CardDescription>Hiển thị {filteredDisputes.length} / {disputes.length} phiếu</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Mã phiếu</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>ID Pin</TableHead>
                                    <TableHead>Vị trí</TableHead>
                                    <TableHead>Độ ưu tiên</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày báo cáo</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDisputes.map((dispute) => (
                                    <TableRow key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <TableCell className="font-mono font-semibold">{dispute.ticketNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{dispute.customerName}</p>
                                                <p className="text-xs text-gray-500">{dispute.customerPhone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(dispute.type)}</TableCell>
                                        <TableCell>
                                            <Link to="/staff/battery-inventory" className="text-blue-600 hover:underline font-mono">
                                                {dispute.batteryId}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">Dock {dispute.dockId} - {dispute.batteryLocation}</span>
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{dispute.reportedDate}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(dispute)}>
                                                <Eye className="h-4 w-4 mr-1" />
                                                Xem
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    {selectedDispute && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="flex items-center text-2xl">
                                    <FileText className="h-6 w-6 mr-2" />
                                    Chi tiết phiếu {selectedDispute.ticketNumber}
                                </SheetTitle>
                                <SheetDescription>Thông tin chi tiết và xử lý phiếu tranh chấp</SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                {/* General Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Thông tin chung</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-gray-500">Mã phiếu</Label>
                                                <p className="font-mono font-semibold">{selectedDispute.ticketNumber}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Loại tranh chấp</Label>
                                                <div className="mt-1">{getTypeBadge(selectedDispute.type)}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Độ ưu tiên</Label>
                                                <div className="mt-1">{getPriorityBadge(selectedDispute.priority)}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Trạng thái</Label>
                                                <div className="mt-1">{getStatusBadge(selectedDispute.status)}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Ngày báo cáo</Label>
                                                <p className="text-sm flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {selectedDispute.reportedDate}
                                                </p>
                                            </div>
                                            {selectedDispute.assignedTo && (
                                                <div>
                                                    <Label className="text-xs text-gray-500">Người xử lý</Label>
                                                    <p className="text-sm flex items-center">
                                                        <User className="h-3 w-3 mr-1" />
                                                        {selectedDispute.assignedTo}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <User className="h-5 w-5 mr-2" />
                                            Thông tin khách hàng
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2 text-gray-500" />
                                            <span className="font-semibold">{selectedDispute.customerName}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                            <span>{selectedDispute.customerPhone}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Battery Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <Battery className="h-5 w-5 mr-2" />
                                            Thông tin pin
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-gray-500">ID Pin</Label>
                                                <Link to="/staff/battery-inventory" className="text-blue-600 hover:underline font-mono font-semibold block">
                                                    {selectedDispute.batteryId}
                                                </Link>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Vị trí</Label>
                                                <p className="flex items-center">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    Dock {selectedDispute.dockId} - {selectedDispute.batteryLocation}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Loại pin</Label>
                                                <p className="text-sm">{selectedDispute.batteryType}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">SoH hiện tại</Label>
                                                <p className="text-sm font-semibold flex items-center">
                                                    {selectedDispute.currentSoh}
                                                    {parseInt(selectedDispute.currentSoh) < 70 && <AlertTriangle className="h-4 w-4 ml-1 text-orange-500" />}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Mức sạc</Label>
                                                <p className="text-sm">{selectedDispute.chargeLevel}%</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Lần đổi gần nhất</Label>
                                                <p className="text-sm">{selectedDispute.lastSwapDate}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Description */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Mô tả vấn đề</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedDispute.description}</p>
                                    </CardContent>
                                </Card>

                                {/* Images */}
                                {selectedDispute.images && selectedDispute.images.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center">
                                                <ImageIcon className="h-5 w-5 mr-2" />
                                                Hình ảnh đính kèm
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2">
                                                {selectedDispute.images.map((img, idx) => (
                                                    <div key={idx} className="w-24 h-24 border rounded-lg overflow-hidden">
                                                        <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* History */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <Clock className="h-5 w-5 mr-2" />
                                            Lịch sử xử lý
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedDispute.history.map((h, idx) => (
                                                <div key={idx} className="flex items-start">
                                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{h.action}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {h.performer} • {h.timestamp}
                                                        </p>
                                                        {h.note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{h.note}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Processing Section */}
                                {selectedDispute.status !== "resolved" && selectedDispute.status !== "rejected" && (
                                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center">
                                                <Edit className="h-5 w-5 mr-2" />
                                                Khu vực xử lý
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Trạng thái</Label>
                                                    <Select value={processingStatus} onValueChange={setProcessingStatus}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Chờ xử lý</SelectItem>
                                                            <SelectItem value="investigating">Đang điều tra</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label>Hình thức bồi thường</Label>
                                                    <Select value={compensationType} onValueChange={setCompensationType}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn hình thức" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="refund">Hoàn tiền</SelectItem>
                                                            <SelectItem value="replacement">Đổi pin mới</SelectItem>
                                                            <SelectItem value="credit">Tích điểm</SelectItem>
                                                            <SelectItem value="none">Không bồi thường</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {compensationType && compensationType !== "none" && (
                                                <div>
                                                    <Label>Số tiền bồi thường (VNĐ)</Label>
                                                    <Input
                                                        type="number"
                                                        value={compensationAmount}
                                                        onChange={(e) => setCompensationAmount(e.target.value)}
                                                        placeholder="Nhập số tiền..."
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <Label>Ghi chú xử lý / Kết luận</Label>
                                                <Textarea
                                                    value={processingNotes}
                                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                                    placeholder="Nhập ghi chú chi tiết về quá trình xử lý, kết quả kiểm tra, kết luận..."
                                                    rows={4}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="flex gap-2">
                                                <Button variant="destructive" onClick={handleReject} className="flex-1">
                                                    <Ban className="h-4 w-4 mr-2" />
                                                    Từ chối
                                                </Button>
                                                <Button variant="outline" onClick={handleUpdateStatus} className="flex-1">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Lưu nháp
                                                </Button>
                                                <Button onClick={handleResolve} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Giải quyết & Đóng
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Resolution (for closed disputes) */}
                                {(selectedDispute.status === "resolved" || selectedDispute.status === "rejected") && (
                                    <Card className="border-2 border-green-200 dark:border-green-800">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center">
                                                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                                                Kết quả xử lý
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-xs text-gray-500">Kết luận</Label>
                                                <p className="text-sm mt-1">{selectedDispute.resolution}</p>
                                            </div>
                                            {selectedDispute.compensationType && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-gray-500">Bồi thường</Label>
                                                        <p className="text-sm font-semibold capitalize">{selectedDispute.compensationType}</p>
                                                    </div>
                                                    {selectedDispute.compensationAmount && selectedDispute.compensationAmount > 0 && (
                                                        <div>
                                                            <Label className="text-xs text-gray-500">Số tiền</Label>
                                                            <p className="text-sm font-semibold">
                                                                {selectedDispute.compensationAmount.toLocaleString("vi-VN")} đ
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <Label className="text-xs text-gray-500">Ngày giải quyết</Label>
                                                <p className="text-sm">{selectedDispute.resolvedDate}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Create Dialog (Placeholder) */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo phiếu tranh chấp mới</DialogTitle>
                        <DialogDescription>Nhập thông tin để tạo phiếu tranh chấp thủ công</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Tên khách hàng</Label>
                            <Input placeholder="Nhập tên khách hàng..." />
                        </div>
                        <div>
                            <Label>Số điện thoại</Label>
                            <Input placeholder="Nhập số điện thoại..." />
                        </div>
                        <div>
                            <Label>ID Pin</Label>
                            <Input placeholder="Nhập ID pin..." />
                        </div>
                        <div>
                            <Label>Loại tranh chấp</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="defective">Pin hư hỏng</SelectItem>
                                    <SelectItem value="low_soh">SoH quá thấp</SelectItem>
                                    <SelectItem value="not_charging">Không sạc được</SelectItem>
                                    <SelectItem value="damage">Pin bị hư hại</SelectItem>
                                    <SelectItem value="performance">Hiệu suất kém</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Mô tả vấn đề</Label>
                            <Textarea placeholder="Nhập mô tả chi tiết..." rows={4} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                toast({
                                    title: "Tính năng đang phát triển",
                                    description: "Chức năng tạo phiếu mới sẽ được cập nhật sau"
                                });
                                setIsCreateOpen(false);
                            }}
                        >
                            Tạo phiếu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DisputeManagement;
