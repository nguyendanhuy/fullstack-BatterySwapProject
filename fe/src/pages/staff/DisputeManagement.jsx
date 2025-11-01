import { useState, useMemo, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    AlertTriangle,
    FileText,
    Loader2,
    Check
} from "lucide-react";
import { getTicketByStationId, updateTicketSolution } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
import dayjs from "dayjs";

const DisputeManagement = () => {
    const { toast } = useToast();
    const { userData } = useContext(SystemContext);

    // States
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filterReason, setFilterReason] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Resolution form states
    const [resolutionMethod, setResolutionMethod] = useState("");
    const [resolutionDescription, setResolutionDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch tickets function (extracted to reuse)
    const fetchTickets = async () => {
        if (!userData?.assignedStationId) {
            toast({
                title: "Lỗi",
                description: "Không tìm thấy thông tin trạm",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await getTicketByStationId(userData.assignedStationId);
            console.log("✅Fetched tickets:", res);
            if (res?.success && res?.tickets) {
                setTickets(res.tickets);
            } else {
                toast({
                    title: "Lỗi",
                    description: res?.message || "Không thể tải danh sách ticket",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Lỗi mạng",
                description: err?.message || "Không thể kết nối đến server",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch tickets on mount
    useEffect(() => {
        fetchTickets();
    }, [userData]);

    // Stats computed values
    const statsData = useMemo(
        () => [
            {
                label: "Tổng ticket",
                count: tickets.length,
                icon: FileText,
                color: "from-blue-500 to-indigo-500",
                bgColor: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
            },
            {
                label: "Đang xử lý",
                count: tickets.filter((t) => t.status === "IN_PROGRESS").length,
                icon: Clock,
                color: "from-orange-500 to-yellow-500",
                bgColor: "from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20"
            },
            {
                label: "Đã giải quyết",
                count: tickets.filter((t) => t.status === "RESOLVED").length,
                icon: CheckCircle,
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            }
        ],
        [tickets]
    );

    // Filtered tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const matchReason = filterReason === "all" || ticket.reason === filterReason;
            const matchStatus = filterStatus === "all" || ticket.status === filterStatus;
            const matchSearch =
                searchQuery === "" ||
                ticket.id.toString().includes(searchQuery) ||
                ticket.bookingId.toString().includes(searchQuery) ||
                ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.createdByStaffName.toLowerCase().includes(searchQuery.toLowerCase());

            return matchReason && matchStatus && matchSearch;
        })
            .sort((a, b) => {
                if (a.status === "IN_PROGRESS" && b.status === "RESOLVED") return -1;
                if (a.status === "RESOLVED" && b.status === "IN_PROGRESS") return 1;
                return 0;
            });
    }, [tickets, filterReason, filterStatus, searchQuery]);

    // Handlers
    const handleViewDetail = (ticket) => {
        setSelectedTicket(ticket);
        // Load existing resolution data if available
        setResolutionMethod(ticket.resolutionMethod || "");
        setResolutionDescription(ticket.resolutionDescription || "");
        setIsDetailOpen(true);
    };

    const handleResolveTicket = async () => {
        if (!selectedTicket) return;

        if (!resolutionMethod.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn phương án giải quyết",
                variant: "destructive",
            });
            return;
        }

        if (!resolutionDescription.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập mô tả giải quyết",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await updateTicketSolution(selectedTicket.id, {
                resolutionMethod: resolutionMethod.trim(),
                resolutionDescription: resolutionDescription.trim()
            });
            console.log("✅Update ticket solution response:", res);

            if (res?.success || !res?.error) {
                toast({
                    title: "Thành công",
                    description: res.message || "Đã giải quyết ticket thành công",
                    className: "bg-green-500 text-white",
                    duration: 3000,
                });

                // Reload tickets to get fresh data from backend
                await fetchTickets();

                // Close sheet - khi mở lại sẽ có data mới
                setIsDetailOpen(false);
            } else {
                toast({
                    title: "Thất bại",
                    description: res?.message || "Không thể giải quyết ticket",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Lỗi",
                description: err?.message || "Đã xảy ra lỗi khi giải quyết ticket",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper badges
    const getStatusBadge = (status) => {
        const styles = {
            IN_PROGRESS: "bg-orange-500 text-white",
            RESOLVED: "bg-green-500 text-white"
        };
        const labels = {
            IN_PROGRESS: "Đang xử lý",
            RESOLVED: "Đã giải quyết"
        };
        return <Badge className={styles[status] || "bg-gray-500 text-white"}>{labels[status] || status}</Badge>;
    };

    const getReasonBadge = (reason) => {
        const styles = {
            BAD_CONDITION: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            SOH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        };
        const labels = {
            BAD_CONDITION: "Tình trạng pin xấu",
            SOH: "Vấn đề SOH",
            OTHER: "Khác"
        };
        return (
            <Badge variant="outline" className={styles[reason] || styles.OTHER}>
                {labels[reason] || reason}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Quản lý Ticket báo cáo</h2>
                <p className="text-gray-600 dark:text-gray-400">Danh sách ticket báo cáo vấn đề pin từ nhân viên</p>
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
                        <Select value={filterReason} onValueChange={setFilterReason}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Lý do" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả lý do</SelectItem>
                                <SelectItem value="BAD_CONDITION">Tình trạng pin xấu</SelectItem>
                                <SelectItem value="SOH">Vấn đề SOH</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                                <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Tìm theo ID ticket, booking ID, tiêu đề..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ticket Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Danh sách ticket
                    </CardTitle>
                    <CardDescription>Hiển thị {filteredTickets.length} / {tickets.length} ticket</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Booking ID</TableHead>
                                        <TableHead>Tiêu đề</TableHead>
                                        <TableHead>Lý do</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Người tạo</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-gray-500 h-32">
                                                <div className="flex flex-col items-center justify-center">
                                                    <AlertTriangle className="h-8 w-8 mb-2 text-gray-400" />
                                                    <p>Không có ticket nào</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTickets.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                                <TableCell className="font-mono font-semibold">#{ticket.id}</TableCell>
                                                <TableCell className="font-mono">{ticket.bookingId}</TableCell>
                                                <TableCell>
                                                    <p className="font-medium max-w-xs truncate">{ticket.title}</p>
                                                </TableCell>
                                                <TableCell>{getReasonBadge(ticket.reason)}</TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell className="text-sm">{ticket.createdByStaffName}</TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {dayjs(ticket.createdAt).format("HH:mm DD/MM/YYYY")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetail(ticket)}>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Xem
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="flex items-center text-2xl">
                                    <FileText className="h-6 w-6 mr-2" />
                                    Chi tiết Ticket #{selectedTicket.id}
                                </SheetTitle>
                                <SheetDescription>Thông tin chi tiết ticket báo cáo</SheetDescription>
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
                                                <Label className="text-xs text-gray-500">Ticket ID</Label>
                                                <p className="font-mono font-semibold">#{selectedTicket.id}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Booking ID</Label>
                                                <p className="font-mono font-semibold">{selectedTicket.bookingId}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Lý do</Label>
                                                <div className="mt-1">{getReasonBadge(selectedTicket.reason)}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Trạng thái</Label>
                                                <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs text-gray-500">Người tạo</Label>
                                                <p className="text-sm">{selectedTicket.createdByStaffName}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs text-gray-500">Ngày tạo</Label>
                                                <p className="text-sm">{dayjs(selectedTicket.createdAt).format("HH:mm:ss - DD/MM/YYYY")}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Title */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tiêu đề</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-semibold">{selectedTicket.title}</p>
                                    </CardContent>
                                </Card>

                                {/* Description */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Mô tả chi tiết</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {selectedTicket.description}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Resolution Section - Always show as editable form */}
                                <Card className={`border-2 ${selectedTicket.status === "RESOLVED" ? "border-green-200 dark:border-green-800" : "border-blue-200 dark:border-blue-800"}`}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            {selectedTicket.status === "RESOLVED" ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                                                    Cập nhật giải quyết ticket
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-5 w-5 mr-2" />
                                                    Giải quyết ticket
                                                </>
                                            )}
                                        </CardTitle>
                                        {selectedTicket.status === "RESOLVED" && selectedTicket.resolvedAt && (
                                            <CardDescription>
                                                Đã giải quyết lúc: {dayjs(selectedTicket.resolvedAt).format("HH:mm:ss - DD/MM/YYYY")}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="resolutionMethod">
                                                Phương án giải quyết <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="resolutionMethod"
                                                placeholder="VD: Thay thế pin mới, Hoàn tiền, Bảo trì..."
                                                value={resolutionMethod}
                                                onChange={(e) => setResolutionMethod(e.target.value)}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="resolutionDescription">
                                                Mô tả giải quyết <span className="text-red-500">*</span>
                                            </Label>
                                            <Textarea
                                                id="resolutionDescription"
                                                placeholder="Nhập mô tả chi tiết về cách giải quyết vấn đề..."
                                                value={resolutionDescription}
                                                onChange={(e) => setResolutionDescription(e.target.value)}
                                                rows={4}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsDetailOpen(false)}
                                                disabled={isSubmitting}
                                                className="flex-1"
                                            >
                                                Đóng
                                            </Button>
                                            <Button
                                                onClick={handleResolveTicket}
                                                disabled={isSubmitting}
                                                className={`flex-1 ${selectedTicket.status === "RESOLVED" ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"}`}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        {selectedTicket.status === "RESOLVED" ? "Cập nhật lại" : "Giải quyết"}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default DisputeManagement;
