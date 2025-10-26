import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SystemContext } from "../../contexts/system.context";
import { getSwapsByStation } from "../../services/axios.services";
import dayjs from "dayjs";
import { History, Search, User, Battery, Clock, CheckCircle, XCircle, BanIcon, Calendar } from "lucide-react";

const statusToBadge = (status) => {
    switch ((status || "").toUpperCase()) {
        case "SUCCESS":
            return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                <CheckCircle className="h-4 w-4 mr-1" />
                Thành công
            </Badge>;
        case "FAILED":
            return <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">
                <XCircle className="h-4 w-4 mr-1" />
                Thất bại
            </Badge>;
        case "CANCELLED":
            return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                <BanIcon className="h-4 w-4 mr-1" />
                Đã hủy
            </Badge>;
        default:
            return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
};

const SwapHistory = () => {
    const { toast } = useToast();
    const { userData } = useContext(SystemContext);
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [expandedDesc, setExpandedDesc] = useState({});

    useEffect(() => {
        const fetchSwaps = async () => {
            const stationId = userData?.assignedStationId;
            if (!stationId) return;

            setLoading(true);
            setError(null);

            try {
                const res = await getSwapsByStation(stationId);
                console.log("Swaps fetched of station " + stationId + " :", res);

                if (res && res.success === false) {
                    setError(res.message || "Không thể tải dữ liệu đổi pin.");
                    setSwaps([]);
                } else {
                    setSwaps(res || []);
                }
            } catch (err) {
                console.error(err);
                setError(err?.message || "Lỗi khi tải lịch sử đổi pin");
                setSwaps([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSwaps();
    }, [userData?.stationId]);

    const filteredSwaps = swaps.filter(swap => {
        const matchesSearch = !searchTerm ||
            swap.swapId?.toString().includes(searchTerm) ||
            swap.bookingId?.toString().includes(searchTerm) ||
            swap.userId?.toString().includes(searchTerm) ||
            swap.staffUserId?.toString().includes(searchTerm);
        const matchesStatus = !filterStatus || filterStatus === "all" || swap.status?.toUpperCase() === filterStatus.toUpperCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Enhanced Header */}
            <header className="bg-white dark:bg-slate-900 border-b">
                <div className="container mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-foreground">Lịch sử đổi pin</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Search and Filter */}
                <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                                <Search className="h-6 w-6 text-white" />
                            </div>
                            Tìm kiếm giao dịch đổi pin
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-base">
                            Tìm kiếm và lọc lịch sử đổi pin theo nhiều tiêu chí
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Tìm theo mã swap, booking, user ID, staff ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                                />
                            </div>
                            <Select onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-64 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 rounded-xl">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="success">Thành công</SelectItem>
                                    <SelectItem value="failed">Thất bại</SelectItem>
                                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-8 transition-all duration-300 hover:scale-105">
                                <Search className="h-5 w-5 mr-2" />
                                Tìm kiếm
                            </Button> */}
                        </div>
                    </CardContent>
                </Card>

                {/* Swap History List */}
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="py-8 text-center text-destructive">{error}</div>
                ) : filteredSwaps.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">Chưa có lịch sử đổi pin.</div>
                ) : (
                    <div className="space-y-6">
                        {filteredSwaps.map((swap, index) => (
                            <Card
                                key={swap.swapId}
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm group rounded-3xl overflow-hidden"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardContent className="p-8">
                                    <div className="grid lg:grid-cols-4 gap-8">
                                        {/* Swap Info */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                                        <History className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-800">Swap #{swap.swapId}</h3>
                                                        <p className="text-sm text-gray-600">Booking #{swap.bookingId}</p>
                                                    </div>
                                                </div>
                                                {statusToBadge(swap.status)}
                                            </div>
                                            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl">
                                                <p className="flex items-center">
                                                    <span className="text-gray-600 w-24">User ID:</span>
                                                    <span className="font-semibold text-gray-800">{swap.userId}</span>
                                                </p>
                                                <p className="flex items-center">
                                                    <span className="text-gray-600 w-24">Staff ID:</span>
                                                    <span className="font-semibold text-blue-600">{swap.staffUserId}</span>
                                                </p>
                                                <p className="flex items-center">
                                                    <span className="text-gray-600 w-24">Station ID:</span>
                                                    <span className="font-semibold text-purple-600">{swap.stationId}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Battery Info */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-lg flex items-center text-gray-800">
                                                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                                                    <Battery className="h-5 w-5 text-white" />
                                                </div>
                                                Thông tin pin
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                                                    <p className="text-sm text-orange-700 font-semibold mb-1">Pin ra:</p>
                                                    <p className="font-bold text-orange-800">ID: {swap.batteryOutId}</p>
                                                    <p className="text-xs text-orange-600 mt-1">Slot: {swap.dockOutSlot}</p>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                    <p className="text-sm text-green-700 font-semibold mb-1">Pin vào:</p>
                                                    <p className="font-bold text-green-800">ID: {swap.batteryInId}</p>
                                                    <p className="text-xs text-green-600 mt-1">Slot: {swap.dockInSlot}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Info */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-lg flex items-center text-gray-800">
                                                <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg mr-3">
                                                    <Clock className="h-5 w-5 text-white" />
                                                </div>
                                                Thời gian
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                                    <p className="text-sm text-blue-700 font-semibold mb-1">Hoàn thành:</p>
                                                    <p className="font-bold text-blue-800">
                                                        {swap.completedTime ? dayjs(swap.completedTime).format('HH:mm') : '-'}
                                                    </p>
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        {swap.completedTime ? dayjs(swap.completedTime).format('DD/MM/YYYY') : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="space-y-4 flex items-start">
                                            {swap.description && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setExpandedDesc(prev => ({ ...prev, [swap.swapId]: !prev[swap.swapId] }))}
                                                    className="w-full"
                                                >
                                                    {expandedDesc[swap.swapId] ? 'Ẩn mô tả' : 'Xem mô tả'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description - Full Width Below */}
                                    {expandedDesc[swap.swapId] && swap.description && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h4 className="font-semibold text-lg text-gray-800 mb-4">Mô tả chi tiết</h4>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                    {swap.description}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Summary Stats */}
                <Card className="mt-8 border-0 shadow-lg bg-white animate-scale-in rounded-3xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                            <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl mr-4">
                                <History className="h-6 w-6 text-white" />
                            </div>
                            Thống kê đổi pin
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-6 text-center">
                            {[
                                {
                                    value: swaps.length.toString(),
                                    label: "Tổng giao dịch",
                                    color: "from-blue-500 to-indigo-500",
                                    icon: History
                                },
                                {
                                    value: swaps.filter(s => s.status?.toUpperCase() === "SUCCESS").length.toString(),
                                    label: "Thành công",
                                    color: "from-green-500 to-emerald-500",
                                    icon: CheckCircle
                                },
                                {
                                    value: swaps.filter(s => s.status?.toUpperCase() === "FAILED").length.toString(),
                                    label: "Thất bại",
                                    color: "from-red-500 to-rose-500",
                                    icon: XCircle
                                },
                                {
                                    value: swaps.filter(s => s.status?.toUpperCase() === "CANCELLED").length.toString(),
                                    label: "Đã hủy",
                                    color: "from-yellow-500 to-orange-500",
                                    icon: BanIcon
                                }
                            ].map((stat, index) => (
                                <div
                                    key={index}
                                    className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl mx-auto mb-4 w-fit`}>
                                        <stat.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</h3>
                                    <p className="text-gray-600 font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SwapHistory;
