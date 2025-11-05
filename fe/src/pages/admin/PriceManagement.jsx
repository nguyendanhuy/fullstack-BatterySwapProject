import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    DollarSign,
    Battery,
    CreditCard,
    Calendar,
    AlertTriangle,
    Zap,
    Edit,
    Check,
    Save,
    ArrowLeft,
    AlertCircle,
    FileText,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// ----- Mock data (JS) -----
const initialPriceData = [
    {
        id: "swap",
        name: "Dịch vụ đổi pin",
        icon: Battery,
        color: "from-orange-500 to-orange-600",
        items: [
            {
                id: "swap_regular",
                category: "swap",
                name: "Đổi pin theo lần",
                description: "Giá đổi pin tiêu chuẩn cho một lần sử dụng",
                price: 35000,
                unit: "lần",
                isActive: true,
                lastUpdated: "15/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "swap_express",
                category: "swap",
                name: "Đổi pin nhanh",
                description: "Dịch vụ đổi pin ưu tiên, phục vụ trong 5 phút",
                price: 50000,
                unit: "lần",
                isActive: true,
                lastUpdated: "10/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "swap_priority",
                category: "swap",
                name: "Đổi pin ưu tiên",
                description: "Ưu tiên hàng đợi, không cần đặt trước",
                price: 45000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Nguyễn A"
            }
        ]
    },
    {
        id: "subscription",
        name: "Gói đăng ký",
        icon: CreditCard,
        color: "from-blue-500 to-blue-600",
        items: [
            {
                id: "sub_basic_monthly",
                category: "subscription",
                name: "Gói cơ bản (tháng)",
                description: "20 lần đổi pin/tháng, không giới hạn đặt chỗ",
                price: 250000,
                unit: "tháng",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "sub_standard_monthly",
                category: "subscription",
                name: "Gói tiêu chuẩn (tháng)",
                description: "40 lần đổi pin/tháng, ưu tiên booking",
                price: 400000,
                unit: "tháng",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "sub_premium_monthly",
                category: "subscription",
                name: "Gói cao cấp (tháng)",
                description: "Không giới hạn đổi pin, miễn phí express",
                price: 600000,
                unit: "tháng",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "sub_basic_yearly",
                category: "subscription",
                name: "Gói cơ bản (năm)",
                description: "Tiết kiệm 17% so với gói tháng",
                price: 2500000,
                unit: "năm",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "sub_standard_yearly",
                category: "subscription",
                name: "Gói tiêu chuẩn (năm)",
                description: "Tiết kiệm 17% so với gói tháng",
                price: 4000000,
                unit: "năm",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "sub_premium_yearly",
                category: "subscription",
                name: "Gói cao cấp (năm)",
                description: "Tiết kiệm 17% so với gói tháng",
                price: 6000000,
                unit: "năm",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            }
        ]
    },
    {
        id: "reservation",
        name: "Phí đặt chỗ",
        icon: Calendar,
        color: "from-green-500 to-green-600",
        items: [
            {
                id: "reservation_basic",
                category: "reservation",
                name: "Đặt chỗ cơ bản",
                description: "Đặt trước 1-6 giờ",
                price: 10000,
                unit: "lần",
                isActive: true,
                lastUpdated: "05/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "reservation_priority",
                category: "reservation",
                name: "Đặt chỗ ưu tiên",
                description: "Đặt trước dưới 1 giờ",
                price: 20000,
                unit: "lần",
                isActive: true,
                lastUpdated: "05/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "reservation_cancel",
                category: "reservation",
                name: "Phí hủy đặt chỗ",
                description: "Hủy trong vòng 30 phút trước giờ hẹn",
                price: 5000,
                unit: "lần",
                isActive: true,
                lastUpdated: "05/12/2024",
                updatedBy: "Admin Nguyễn A"
            }
        ]
    },
    {
        id: "penalty",
        name: "Phí phạt",
        icon: AlertTriangle,
        color: "from-red-500 to-red-600",
        items: [
            {
                id: "penalty_late_return",
                category: "penalty",
                name: "Trả pin muộn",
                description: "Phạt theo giờ quá hạn",
                price: 15000,
                unit: "giờ",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "penalty_damaged",
                category: "penalty",
                name: "Pin hư hỏng",
                description: "Phạt khi trả pin bị hư hỏng do người dùng",
                price: 500000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "penalty_lost",
                category: "penalty",
                name: "Làm mất pin",
                description: "Bồi thường khi làm mất pin",
                price: 2000000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            },
            {
                id: "penalty_no_show",
                category: "penalty",
                name: "Không đến đúng hẹn",
                description: "Phạt khi đặt chỗ nhưng không đến",
                price: 10000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Trần B"
            }
        ]
    },
    {
        id: "battery_type",
        name: "Giá theo loại pin",
        icon: Zap,
        color: "from-purple-500 to-purple-600",
        items: [
            {
                id: "battery_lithium",
                category: "battery_type",
                name: "Pin Lithium-ion",
                description: "48V 20Ah - Tiêu chuẩn",
                price: 35000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "battery_lfp",
                category: "battery_type",
                name: "Pin LFP",
                description: "48V 25Ah - Cao cấp, tuổi thọ cao",
                price: 45000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Nguyễn A"
            },
            {
                id: "battery_nimh",
                category: "battery_type",
                name: "Pin NiMH",
                description: "36V 15Ah - Phổ thông",
                price: 25000,
                unit: "lần",
                isActive: true,
                lastUpdated: "01/12/2024",
                updatedBy: "Admin Nguyễn A"
            }
        ]
    }
];

// ----- Stats Card (JS) -----
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div
                    className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        `bg-gradient-to-r ${color}`
                    )}
                >
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const PriceManagement = () => {
    const { toast } = useToast();
    const [priceCategories, setPriceCategories] = useState(initialPriceData);
    const [selectedCategory, setSelectedCategory] = useState("swap");
    const [editingItem, setEditingItem] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newPrice, setNewPrice] = useState("");
    const [changeReason, setChangeReason] = useState("");
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Computed values
    const totalServices = priceCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const lastUpdate = "2 ngày trước";

    // Format price helper
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(price);
    };

    // Handlers
    const handleEditPrice = (item) => {
        setEditingItem(item);
        setNewPrice(item.price.toString());
        setChangeReason("");
        setIsEditDialogOpen(true);
    };

    const handleUpdatePrice = () => {
        if (!editingItem || !newPrice) return;

        const priceValue = parseInt(newPrice.replace(/\D/g, ""), 10);

        if (isNaN(priceValue) || priceValue <= 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập giá hợp lệ",
                variant: "destructive"
            });
            return;
        }

        setPriceCategories((categories) =>
            categories.map((cat) => ({
                ...cat,
                items: cat.items.map((item) =>
                    item.id === editingItem.id
                        ? {
                            ...item,
                            price: priceValue,
                            lastUpdated: new Date().toLocaleDateString("vi-VN"),
                            updatedBy: "Admin hiện tại"
                        }
                        : item
                )
            }))
        );

        setUnsavedChanges(true);
        setIsEditDialogOpen(false);

        toast({
            title: "Cập nhật giá thành công",
            description: `Giá ${editingItem.name} đã được cập nhật thành ${formatPrice(priceValue)}`
        });
    };

    const handleSaveAll = () => {
        // TODO: API call to save all changes
        toast({
            title: "Lưu thành công",
            description: "Tất cả thay đổi giá đã được lưu vào hệ thống"
        });
        setUnsavedChanges(false);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Quản lý Giá cả</h1>
                            <p className="text-purple-100 text-sm">Điều chỉnh giá dịch vụ của hệ thống</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {unsavedChanges && (
                            <Badge variant="secondary" className="bg-yellow-500 text-white">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Có thay đổi chưa lưu
                            </Badge>
                        )}
                        <Button
                            variant="secondary"
                            onClick={handleSaveAll}
                            disabled={!unsavedChanges}
                            className="bg-white text-purple-600 hover:bg-white/90"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Lưu tất cả
                        </Button>
                        <Link to="/admin">
                            <Button variant="ghost" className="text-white hover:bg-white/20">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-6">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <StatsCard icon={FileText} label="Tổng dịch vụ" value={totalServices} color="from-blue-500 to-blue-600" />
                    <StatsCard icon={Battery} label="Đổi pin cơ bản" value={formatPrice(35000)} color="from-orange-500 to-orange-600" />
                    <StatsCard icon={CreditCard} label="Gói đăng ký phổ biến" value={formatPrice(400000)} color="from-green-500 to-green-600" />
                    <StatsCard icon={Clock} label="Cập nhật gần nhất" value={lastUpdate} color="from-purple-500 to-purple-600" />
                </div>

                {/* Category Tabs */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid grid-cols-5 mb-6">
                        {priceCategories.map((category) => (
                            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
                                <category.icon className="h-4 w-4 mr-2" />
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Price Tables */}
                    {priceCategories.map((category) => (
                        <TabsContent key={category.id} value={category.id}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center mr-3",
                                                `bg-gradient-to-r ${category.color}`
                                            )}
                                        >
                                            <category.icon className="h-5 w-5 text-white" />
                                        </div>
                                        {category.name}
                                    </CardTitle>
                                    <CardDescription>{category.items.length} dịch vụ trong danh mục</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tên dịch vụ</TableHead>
                                                <TableHead>Giá hiện tại</TableHead>
                                                <TableHead>Đơn vị</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Cập nhật</TableHead>
                                                <TableHead>Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {category.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.name}</div>
                                                            <div className="text-sm text-muted-foreground">{item.description}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{item.unit}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.isActive ? "default" : "secondary"}>
                                                            {item.isActive ? "Hoạt động" : "Tạm dừng"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{item.lastUpdated}</TableCell>
                                                    <TableCell>
                                                        <Button size="sm" variant="outline" onClick={() => handleEditPrice(item)}>
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Sửa
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Edit Price Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật giá dịch vụ</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4">
                            <div>
                                <Label>Dịch vụ</Label>
                                <Input value={editingItem.name} disabled className="bg-muted" />
                            </div>

                            <div>
                                <Label>Giá hiện tại</Label>
                                <div className="text-2xl font-bold text-muted-foreground">{formatPrice(editingItem.price)}</div>
                            </div>

                            <div>
                                <Label>Giá mới *</Label>
                                <Input
                                    type="text"
                                    placeholder="Nhập giá mới (VNĐ)"
                                    value={newPrice}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setNewPrice(value);
                                    }}
                                    onBlur={() => {
                                        if (newPrice) {
                                            const numValue = parseInt(newPrice, 10);
                                            if (!isNaN(numValue)) {
                                                setNewPrice(numValue.toLocaleString("vi-VN"));
                                            }
                                        }
                                    }}
                                    onFocus={() => {
                                        if (newPrice) {
                                            setNewPrice(newPrice.replace(/\D/g, ""));
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <Label>Lý do thay đổi (tùy chọn)</Label>
                                <Textarea
                                    placeholder="VD: Điều chỉnh theo thị trường, thay đổi chính sách..."
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                                    onClick={handleUpdatePrice}
                                    disabled={!newPrice || newPrice.replace(/\D/g, "") === editingItem.price.toString()}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Cập nhật giá
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PriceManagement;
