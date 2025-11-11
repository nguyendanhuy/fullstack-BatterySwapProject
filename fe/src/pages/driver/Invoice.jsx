import { useState, useEffect, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
    ArrowLeft,
    Wallet,
    CreditCard,
    ShoppingCart,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoicebyUserId } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";

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

// Lấy thông tin hiển thị cho loại hóa đơn
const getInvoiceTypeInfo = (invoiceType, transactionType) => {
    // Ưu tiên transactionType để phân biệt PAYMENT vs REFUND
    if (transactionType === "REFUND") {
        return {
            icon: ArrowDownLeft,
            label: "Hoàn tiền",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
            isPositive: true // Hoàn tiền = + tiền
        };
    }

    // Nếu là PAYMENT, phân biệt theo invoiceType
    const typeConfig = {
        WALLET_TOPUP: {
            icon: Wallet,
            label: "Nạp tiền vào ví",
            color: "text-green-600",
            bgColor: "bg-green-50",
            badgeClass: "bg-green-100 text-green-800 border-green-300",
            isPositive: true // Nạp tiền = + tiền
        },
        BOOKING: {
            icon: ShoppingCart,
            label: "Thanh toán Booking",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
            isPositive: false // Thanh toán = - tiền
        },
        SUBSCRIPTION: {
            icon: CreditCard,
            label: "Thanh toán Gói tháng",
            color: "text-indigo-600",
            bgColor: "bg-indigo-50",
            badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
            isPositive: false // Thanh toán = - tiền
        },
        PENALTY: {
            icon: AlertTriangle,
            label: "Phạt",
            color: "text-red-600",
            bgColor: "bg-red-50",
            badgeClass: "bg-red-100 text-red-800 border-red-300",
            isPositive: false // Phạt = - tiền
        }
    };

    return typeConfig[invoiceType] || {
        icon: FileText,
        label: invoiceType || "Khác",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
        isPositive: false
    };
};

// Lấy thông tin hiển thị cho phương thức thanh toán
const getPaymentMethodInfo = (paymentMethod) => {
    const methodConfig = {
        CASH: { label: "Tiền mặt", icon: "💵" },
        WALLET: { label: "Ví điện tử", icon: "👛" },
        VNPAY: { label: "VNPay", icon: "🏦" },
        SUBSCRIPTION: { label: "Gói tháng", icon: "📅" }
    };
    return methodConfig[paymentMethod] || { label: paymentMethod, icon: "💳" };
};

// Chỉ giữ 2 trạng thái cho HÓA ĐƠN: PENDING, PAID
const getStatusBadge = (status) => {
    const statusConfig = {
        PAID: { label: "Đã thanh toán", className: "bg-green-100 text-green-800 border-green-300" },
        PENDING: { label: "Đang chờ", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    };
    return statusConfig[status] || statusConfig.PENDING;
};

const calculateStats = (invoices) => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.invoiceStatus === "PAID").length;
    const pendingInvoices = invoices.filter((inv) => inv.invoiceStatus === "PENDING").length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.invoiceStatus === "PAID" ? inv.totalAmount : 0), 0);

    return { totalInvoices, paidInvoices, pendingInvoices, totalAmount };
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
    // Lưu ý: bookingStatus có thể khác; badge hiển thị theo bookingStatus riêng nếu bạn muốn.
    const statusBadge = getStatusBadge(booking.bookingStatus);

    return (
        <div
            className={`bg-gradient-to-br rounded-xl p-6 mb-4 border-2 transition-all duration-300 ${isHighlighted
                ? "from-yellow-50 to-orange-50 border-orange-300 shadow-lg animate-pulse"
                : "from-slate-50 to-blue-50 border-slate-200 hover:shadow-md"
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg">Booking #{booking.bookingId}</h4>
                    {isHighlighted && <Badge className="bg-orange-500 text-white">Được tìm thấy</Badge>}
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
    const [filterStatus, setFilterStatus] = useState("all"); // "all" | "PAID" | "PENDING"
    const [filterType, setFilterType] = useState("all"); // "all" | "WALLET_TOPUP" | "BOOKING" | "SUBSCRIPTION" | "PENALTY" | "REFUND"
    const [loading, setLoading] = useState(false);
    const [highlightBookingId, setHighlightBookingId] = useState(null);
    const [targetInvoiceId, setTargetInvoiceId] = useState(null);

    // Lấy booking ID từ navigation state (từ BookingHistory)
    const targetBookingId = location.state?.bookingId;

    useEffect(() => {
        loadInvoices();

        if (targetBookingId) {
            setHighlightBookingId(targetBookingId);
            setTimeout(() => setHighlightBookingId(null), 5000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetBookingId]);

    const loadInvoices = async () => {
        if (!userData?.userId) return;

        setLoading(true);
        try {
            const res = await getInvoicebyUserId(userData.userId);
            console.log("✅Invoices:", res);
            if (res && Array.isArray(res?.invoices)) {
                // 1) Lọc cứng: chỉ giữ PENDING | PAID  theo invoiceId giảm dần
                const filtered = res.invoices.filter(
                    (inv) => inv.invoiceStatus === "PENDING" || inv.invoiceStatus === "PAID"
                ).sort((a, b) => b.invoiceId - a.invoiceId);
                setInvoices(filtered);

                // 2) Nếu có targetBookingId, tìm trong danh sách đã lọc
                if (targetBookingId) {
                    const targetInvoice = filtered.find((inv) =>
                        inv.bookings?.some((booking) => booking.bookingId === targetBookingId)
                    ); //tìm trong mỗi invoice, các booking coi có khớp không
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

    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            if (targetInvoiceId) {
                return inv.invoiceId === targetInvoiceId;
            }

            // Lọc theo tab trạng thái
            const statusMatch = filterStatus === "all" || inv.invoiceStatus === filterStatus;
            if (!statusMatch) return false;

            // Lọc theo loại hóa đơn
            if (filterType !== "all") {
                const transactionType = inv.paymentInfo?.transactionType;
                if (filterType === "REFUND") {
                    return transactionType === "REFUND";
                } else {
                    return inv.invoiceType === filterType;
                }
            }

            return true;
        });
    }, [invoices, targetInvoiceId, filterStatus, filterType]);

    const stats = useMemo(() => calculateStats(invoices), [invoices]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        {targetBookingId && (
                            <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
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
                                    : "Quản lý và theo dõi tất cả hóa đơn của bạn"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Ẩn khi có targetBookingId */}
                {!targetBookingId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard icon={FileText} label="Tổng hóa đơn" value={stats.totalInvoices} iconColor="bg-blue-500" />
                        <StatsCard icon={CheckCircle} label="Đã thanh toán" value={stats.paidInvoices} iconColor="bg-green-500" />
                        <StatsCard icon={Clock} label="Đang chờ" value={stats.pendingInvoices} iconColor="bg-yellow-500" />
                        <StatsCard
                            icon={DollarSign}
                            label="Tổng chi"
                            value={formatCurrency(stats.totalAmount)}
                            iconColor="bg-purple-500"
                        />
                    </div>
                )}

                {/* Filter Tabs - Ẩn khi có targetBookingId */}
                {!targetBookingId && (
                    <div className="space-y-4 mb-6">
                        {/* Tab trạng thái thanh toán */}
                        <div>
                            <p className="text-sm font-medium mb-2 text-muted-foreground">Trạng thái</p>
                            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
                                <TabsList className="grid w-full md:w-auto grid-cols-3">
                                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                                    <TabsTrigger value="PAID">Đã thanh toán</TabsTrigger>
                                    <TabsTrigger value="PENDING">Đang chờ</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Tab loại hóa đơn */}
                        <div>
                            <p className="text-sm font-medium mb-2 text-muted-foreground">Loại hóa đơn</p>
                            <Tabs value={filterType} onValueChange={(value) => setFilterType(value)}>
                                <TabsList className="grid w-full md:w-auto grid-cols-3 lg:grid-cols-6">
                                    <TabsTrigger value="all" className="flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5" />
                                        Tất cả
                                    </TabsTrigger>
                                    <TabsTrigger value="WALLET_TOPUP" className="flex items-center gap-1">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Nạp tiền
                                    </TabsTrigger>
                                    <TabsTrigger value="BOOKING" className="flex items-center gap-1">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Booking
                                    </TabsTrigger>
                                    <TabsTrigger value="SUBSCRIPTION" className="flex items-center gap-1">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        Gói tháng
                                    </TabsTrigger>
                                    <TabsTrigger value="PENALTY" className="flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Phạt
                                    </TabsTrigger>
                                    <TabsTrigger value="REFUND" className="flex items-center gap-1">
                                        <ArrowDownLeft className="h-3.5 w-3.5" />
                                        Hoàn tiền
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
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
                                : "Chưa có hóa đơn nào trong danh mục này"}
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

                            // Lấy thông tin từ paymentInfo nếu có
                            const paymentMethod = invoice.paymentInfo?.paymentMethod || invoice.paymentMethod;
                            const transactionType = invoice.paymentInfo?.transactionType;

                            // Lấy thông tin hiển thị cho loại hóa đơn
                            const invoiceTypeInfo = getInvoiceTypeInfo(invoice.invoiceType, transactionType);
                            const InvoiceIcon = invoiceTypeInfo.icon;

                            // Lấy thông tin phương thức thanh toán
                            const paymentMethodInfo = paymentMethod ? getPaymentMethodInfo(paymentMethod) : null;

                            return (
                                <AccordionItem
                                    key={invoice.invoiceId}
                                    value={`invoice-${invoice.invoiceId}`}
                                    className={`border-2 rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all duration-300 ${isTargetInvoice ? "border-orange-300 shadow-lg" : "border-slate-200"
                                        }`}
                                >
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`${invoiceTypeInfo.bgColor} p-3 rounded-full border-2 ${invoiceTypeInfo.isPositive ? "border-green-300" : "border-red-300"
                                                    }`}>
                                                    <InvoiceIcon className={`h-6 w-6 ${invoiceTypeInfo.color}`} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        Hóa đơn #{invoice.invoiceId}
                                                        {isTargetInvoice && (
                                                            <Badge className="bg-orange-500 text-white text-xs">Booking #{targetBookingId}</Badge>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-2 text-sm">
                                                        <Badge className={`${invoiceTypeInfo.badgeClass} border font-semibold`}>
                                                            {invoiceTypeInfo.label}
                                                        </Badge>
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(invoice.createdDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${statusBadge.className} border text-sm px-4 py-1`}>{statusBadge.label}</Badge>
                                                <div className="text-right min-w-[180px]">
                                                    <p className={`text-2xl font-bold ${invoiceTypeInfo.isPositive ? "text-green-600" : "text-red-600"
                                                        }`}>
                                                        {invoiceTypeInfo.isPositive ? "+ " : "- "}
                                                        {formatCurrency(invoice.totalAmount)}
                                                    </p>
                                                    {paymentMethodInfo && (
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                                                            <span>{paymentMethodInfo.icon}</span>
                                                            <span>{paymentMethodInfo.label}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6">
                                        <div className="pt-4 border-t-2">
                                            {/* Thông tin chi tiết hóa đơn */}
                                            <div className={`rounded-xl p-5 mb-6 border-2 ${invoiceTypeInfo.isPositive ? "border-green-300" : "border-red-300"
                                                } ${invoiceTypeInfo.bgColor}`}>
                                                <h4 className="font-semibold text-sm mb-4 text-gray-700 flex items-center gap-2">
                                                    <Receipt className="h-4 w-4" />
                                                    Thông tin thanh toán
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                        <p className="text-xs text-gray-500 mb-1.5">Loại hóa đơn</p>
                                                        <div className="flex items-center gap-2">
                                                            <InvoiceIcon className={`h-4 w-4 ${invoiceTypeInfo.color}`} />
                                                            <span className={`font-semibold ${invoiceTypeInfo.color}`}>
                                                                {invoiceTypeInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {paymentMethodInfo && (
                                                        <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                            <p className="text-xs text-gray-500 mb-1.5">Phương thức</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{paymentMethodInfo.icon}</span>
                                                                <span className="font-semibold text-gray-700">
                                                                    {paymentMethodInfo.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {invoice.planToActivate?.planName && (
                                                        <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                            <p className="text-xs text-gray-500 mb-1.5">Gói kích hoạt</p>
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="h-4 w-4 text-indigo-600" />
                                                                <span className="font-semibold text-indigo-600">
                                                                    {invoice.planToActivate.planName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thông tin số lượng và giá */}
                                                {(invoice.numberOfSwaps || invoice.pricePerSwap) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                        {invoice.numberOfSwaps > 0 && (
                                                            <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1.5">Số lượt đổi</p>
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="h-4 w-4 text-amber-600" />
                                                                    <span className="font-semibold text-gray-700">
                                                                        {invoice.numberOfSwaps} lượt
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {invoice.pricePerSwap > 0 && (
                                                            <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1.5">Giá mỗi lượt</p>
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                                    <span className="font-semibold text-gray-700">
                                                                        {formatCurrency(invoice.pricePerSwap)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="bg-white rounded-lg p-3 border shadow-sm">
                                                            <p className="text-xs text-gray-500 mb-1.5">Tổng tiền</p>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className={`h-4 w-4 ${invoiceTypeInfo.isPositive ? "text-green-600" : "text-red-600"
                                                                    }`} />
                                                                <span className={`font-bold text-lg ${invoiceTypeInfo.isPositive ? "text-green-600" : "text-red-600"
                                                                    }`}>
                                                                    {invoiceTypeInfo.isPositive ? "+ " : "- "}
                                                                    {formatCurrency(invoice.totalAmount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chi tiết booking */}
                                            {invoice.bookings && invoice.bookings.length > 0 && (
                                                <>
                                                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                        <Receipt className="h-5 w-5 text-primary" />
                                                        Chi tiết các booking ({invoice.bookings.length})
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {invoice.bookings.map((booking) => (
                                                            <BookingCard
                                                                key={booking.bookingId}
                                                                booking={booking}
                                                                isHighlighted={highlightBookingId === booking.bookingId}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
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
}
export default Invoices;
