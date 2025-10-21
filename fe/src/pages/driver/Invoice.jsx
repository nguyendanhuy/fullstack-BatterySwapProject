import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    CheckCircle,
    Clock,
    DollarSign,
    MapPin,
    Calendar,
    Car,
    Battery,
    Zap,
    AlertCircle,
    Receipt,
    Search,
    ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInvoicebyUserId } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";

// const mockInvoicesData = {
//     total: 2,
//     invoices: [
//         {
//             invoiceId: 10048,
//             userId: "DR004",
//             createdDate: "2025-10-21",
//             totalAmount: 45000,
//             pricePerSwap: 15000,
//             numberOfSwaps: 2,
//             bookings: [
//                 {
//                     bookingId: 142,
//                     bookingDate: "2025-10-22",
//                     timeSlot: "08:00:00",
//                     vehicleType: "FELIZ",
//                     amount: 15000,
//                     bookingStatus: "PENDINGSWAPPING",
//                     stationId: 12,
//                     stationName: "Trạm Kha Vạn Cân - Thủ Đức",
//                     stationAddress:
//                         "102 Kha Vạn Cân, Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh",
//                     vehicleId: 9,
//                     licensePlate: "30B2-23459",
//                     vehicleBatteryType: "LITHIUM_ION",
//                 },
//                 {
//                     bookingId: 143,
//                     bookingDate: "2025-10-22",
//                     timeSlot: "08:30:00",
//                     vehicleType: "KLARA_S",
//                     amount: 30000,
//                     bookingStatus: "PENDINGSWAPPING",
//                     stationId: 12,
//                     stationName: "Trạm Kha Vạn Cân - Thủ Đức",
//                     stationAddress:
//                         "102 Kha Vạn Cân, Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh",
//                     vehicleId: 13,
//                     licensePlate: "31C3-34569",
//                     vehicleBatteryType: "LITHIUM_ION",
//                 },
//             ],
//             invoiceStatus: "PAID",
//         },
//         {
//             invoiceId: 10043,
//             userId: "DR004",
//             createdDate: "2025-10-20",
//             totalAmount: 30000,
//             pricePerSwap: 15000,
//             numberOfSwaps: 2,
//             bookings: [],
//             invoiceStatus: "PAID",
//         },
//     ],
//     success: true,
//     userId: "DR004",
// };

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatTime = (timeString) => {
    return timeString.substring(0, 5);
};

const getStatusBadge = (status) => {
    const statusConfig = {
        PAID: { label: "Đã thanh toán", className: "bg-green-100 text-green-800 border-green-300" },
        UNPAID: { label: "Chưa thanh toán", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
        PENDINGSWAPPING: { label: "Chờ đổi pin", className: "bg-blue-100 text-blue-800 border-blue-300" },
        COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800 border-green-300" },
        CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-300" },
    };

    return statusConfig[status] || statusConfig.UNPAID;
};

const calculateStats = (invoices) => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.invoiceStatus === "PAID").length;
    const unpaidInvoices = totalInvoices - paidInvoices;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return { totalInvoices, paidInvoices, unpaidInvoices, totalAmount };
};

const StatsCard = ({ icon: Icon, label, value, iconColor }) => (
    <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in border-2">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${iconColor}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const BookingCard = ({ booking, isHighlighted }) => {
    const statusBadge = getStatusBadge(booking.bookingStatus);

    return (
        <div className={`bg-gradient-to-br rounded-xl p-6 mb-4 border-2 transition-all duration-300 ${isHighlighted
            ? 'from-yellow-50 to-orange-50 border-orange-300 shadow-lg animate-pulse'
            : 'from-slate-50 to-blue-50 border-slate-200 hover:shadow-md'
            }`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg">Booking #{booking.bookingId}</h4>
                    {isHighlighted && (
                        <Badge className="bg-orange-500 text-white">Được tìm thấy</Badge>
                    )}
                </div>
                <Badge className={`${statusBadge.className} border`}>{statusBadge.label}</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Trạm đổi pin</p>
                            <p className="font-semibold">{booking.stationName}</p>
                            <p className="text-sm text-muted-foreground">{booking.stationAddress}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Thời gian</p>
                            <p className="font-semibold">
                                {formatDate(booking.bookingDate)} - {formatTime(booking.timeSlot)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Phương tiện</p>
                            <p className="font-semibold">
                                {booking.vehicleType} ({booking.licensePlate})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Battery className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Loại pin</p>
                            <p className="font-semibold">{booking.vehicleBatteryType}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Số tiền</p>
                            <p className="font-semibold text-lg text-primary">{formatCurrency(booking.amount)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Invoices = () => {
    const { userData } = useContext(SystemContext);
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [filterStatus, setFilterStatus] = useState("all"); // "all" | "paid" | "unpaid"
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [highlightBookingId, setHighlightBookingId] = useState(null);
    const [targetInvoiceId, setTargetInvoiceId] = useState(null);

    // Lấy booking ID từ navigation state (từ BookingHistory)
    const targetBookingId = location.state?.bookingId;

    useEffect(() => {
        loadInvoices();

        // Nếu có bookingId từ navigation, highlight nó
        if (targetBookingId) {
            setHighlightBookingId(targetBookingId);
            // Remove highlight after 5 seconds
            setTimeout(() => setHighlightBookingId(null), 5000);
        }
    }, [targetBookingId]);

    const loadInvoices = async () => {
        if (!userData?.userId) return;

        setLoading(true);
        try {
            const res = await getInvoicebyUserId(userData.userId);
            if (res && Array.isArray(res?.invoices)) {
                setInvoices(res.invoices);

                // Nếu có targetBookingId, tìm invoice chứa booking đó
                if (targetBookingId) {
                    const targetInvoice = res.invoices.find(inv =>
                        inv.bookings.some(booking => booking.bookingId === targetBookingId)
                    );
                    if (targetInvoice) {
                        setTargetInvoiceId(targetInvoice.invoiceId);
                    }
                }
            } else {
                toast({
                    title: "Lỗi tải hóa đơn",
                    description: "API trả về dữ liệu không hợp lệ.",
                    variant: "destructive",
                });
                setInvoices([]);
            }
        } catch (err) {
            toast({
                title: "Lỗi mạng khi tải hóa đơn",
                description: String(err?.message ?? err),
                variant: "destructive",
            });
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter((inv) => {
        // Nếu có targetBookingId, chỉ hiển thị invoice chứa booking đó
        if (targetBookingId) {
            const hasTargetBooking = inv.bookings.some(booking => booking.bookingId === targetBookingId);
            if (!hasTargetBooking) return false;
        }

        // Filter by status
        const statusMatch =
            filterStatus === "all" ||
            (filterStatus === "PAID" && inv.invoiceStatus === "PAID") ||
            (filterStatus === "PAYMENTFAILED" && inv.invoiceStatus === "UNPAID");

        if (!statusMatch) return false;

        // Filter by search query
        if (searchQuery.trim() === "") return true;

        const query = searchQuery.toLowerCase();

        // Search in invoice ID
        if (inv.invoiceId.toString().includes(query)) return true;

        // Search in bookings
        return inv.bookings.some(
            (booking) =>
                booking.bookingId.toString().includes(query) ||
                booking.stationName.toLowerCase().includes(query) ||
                booking.stationAddress.toLowerCase().includes(query) ||
                booking.vehicleType.toLowerCase().includes(query) ||
                booking.licensePlate.toLowerCase().includes(query) ||
                booking.vehicleBatteryType.toLowerCase().includes(query)
        );
    });

    const stats = calculateStats(invoices);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        {targetBookingId && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                            </Button>
                        )}
                        <div>
                            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                Hóa đơn
                            </h1>
                            <p className="text-muted-foreground">
                                {targetBookingId
                                    ? `Hiển thị hóa đơn cho booking #${targetBookingId}`
                                    : "Quản lý và theo dõi tất cả hóa đơn của bạn"
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Ẩn khi có targetBookingId */}
                {!targetBookingId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard icon={FileText} label="Tổng hóa đơn" value={stats.totalInvoices} iconColor="bg-blue-500" />
                        <StatsCard icon={CheckCircle} label="Đã thanh toán" value={stats.paidInvoices} iconColor="bg-green-500" />
                        <StatsCard icon={Clock} label="Chưa thanh toán" value={stats.unpaidInvoices} iconColor="bg-yellow-500" />
                        <StatsCard icon={DollarSign} label="Tổng chi" value={formatCurrency(stats.totalAmount)} iconColor="bg-purple-500" />
                    </div>
                )}

                {/* Search Bar - Ẩn khi có targetBookingId */}
                {!targetBookingId && (
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo booking ID, tên trạm, loại xe, biển số..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 py-6 text-base border-2 focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* Filter Tabs - Ẩn khi có targetBookingId */}
                {!targetBookingId && (
                    <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value)} className="mb-6">
                        <TabsList className="grid w-full md:w-auto grid-cols-3">
                            <TabsTrigger value="all">Tất cả ({invoices.length})</TabsTrigger>
                            <TabsTrigger value="paid">Đã thanh toán ({stats.paidInvoices})</TabsTrigger>
                            <TabsTrigger value="unpaid">Chưa thanh toán ({stats.unpaidInvoices})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {/* Invoice List */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <Spin size="large" />
                        <p className="mt-4 text-muted-foreground">Đang tải hóa đơn...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <Card className="p-12 text-center">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Không có hóa đơn</h3>
                        <p className="text-muted-foreground">
                            {targetBookingId
                                ? `Không tìm thấy hóa đơn cho booking #${targetBookingId}`
                                : "Chưa có hóa đơn nào trong danh mục này"
                            }
                        </p>
                    </Card>
                ) : (
                    <Accordion
                        type="single"
                        collapsible
                        className="space-y-4"
                        defaultValue={targetInvoiceId ? `invoice-${targetInvoiceId}` : undefined}
                    >
                        {filteredInvoices.map((invoice) => {
                            const statusBadge = getStatusBadge(invoice.invoiceStatus);
                            const isTargetInvoice = targetInvoiceId === invoice.invoiceId;

                            return (
                                <AccordionItem
                                    key={invoice.invoiceId}
                                    value={`invoice-${invoice.invoiceId}`}
                                    className={`border-2 rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all duration-300 ${isTargetInvoice ? 'border-orange-300 shadow-lg' : ''
                                        }`}
                                >
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/10 p-3 rounded-full">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        Hóa đơn #{invoice.invoiceId}
                                                        {isTargetInvoice && (
                                                            <Badge className="bg-orange-500 text-white text-xs">
                                                                Booking #{targetBookingId}
                                                            </Badge>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(invoice.createdDate)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Zap className="h-4 w-4" />
                                                            {invoice.numberOfSwaps} lượt đổi
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4" />
                                                            {formatCurrency(invoice.pricePerSwap)}/lượt
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${statusBadge.className} border text-sm px-4 py-1`}>{statusBadge.label}</Badge>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6">
                                        <div className="pt-4 border-t-2">
                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <Receipt className="h-5 w-5 text-primary" />
                                                Chi tiết các booking ({invoice.bookings.length})
                                            </h4>
                                            {invoice.bookings.length === 0 ? (
                                                <div className="bg-slate-100 rounded-xl p-8 text-center">
                                                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                                    <p className="text-muted-foreground">Không có booking nào trong hóa đơn này</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {invoice.bookings.map((booking) => (
                                                        <BookingCard
                                                            key={booking.bookingId}
                                                            booking={booking}
                                                            isHighlighted={highlightBookingId === booking.bookingId}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>
        </div>
    );
};

export default Invoices;
