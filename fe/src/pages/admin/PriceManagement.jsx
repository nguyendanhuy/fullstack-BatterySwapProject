import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Check, Home, Users } from "lucide-react";
import { getSystemPriceAdmin, updateSystemPriceAdmin } from "../../services/axios.services";

// Helpers
const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price ?? 0);

const fmtDateTimeVN = (isoOrNull) => {
    if (!isoOrNull) return "-";
    try {
        return new Date(isoOrNull).toLocaleString("vi-VN");
    } catch {
        return "-";
    }
};

export default function PriceManagement() {
    const { toast } = useToast();

    // Dữ liệu bảng từ BE
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sửa giá
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [priceInput, setPriceInput] = useState("");
    const [descInput, setDescInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Tìm kiếm
    const [q, setQ] = useState("");

    // Tải dữ liệu
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getSystemPriceAdmin();
            setRows(Array.isArray(res?.data) ? res.data : res);
        } catch (e) {
            toast({
                title: "Lỗi tải dữ liệu",
                description: "Không thể tải bảng giá từ máy chủ.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // once

    const filteredRows = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter(
            (r) =>
                String(r.id).toLowerCase().includes(s) ||
                String(r.priceType).toLowerCase().includes(s) ||
                String(r.description || "").toLowerCase().includes(s)
        );
    }, [rows, q]);

    const openEdit = (row) => {
        setEditingItem(row);
        setPriceInput(String(row.price ?? ""));
        setDescInput(String(row.description ?? ""));
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        const raw = String(priceInput).replace(/\D/g, "");
        const parsed = parseInt(raw, 10);

        if (!raw || isNaN(parsed) || parsed <= 0) {
            toast({
                title: "Giá không hợp lệ",
                description: "Vui lòng nhập số tiền > 0.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            await updateSystemPriceAdmin(editingItem.priceType, parsed, descInput || "");
            await fetchData(); // để lấy updatedDate chuẩn từ BE
            setIsEditOpen(false);
            toast({
                title: "Cập nhật thành công",
                description: `Đã cập nhật ${editingItem.priceType} → ${formatPrice(parsed)}`,
            });
        } catch (e) {
            toast({
                title: "Cập nhật thất bại",
                description: "Không thể cập nhật giá. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header gradient KHÔNG sticky */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            {/* Đổi title/subtitle theo nhu cầu */}
                            <h1 className="text-xl font-bold">Quản lý giá hệ thống</h1>
                            <p className="text-blue-100 text-sm">Cập nhật và điều chỉnh giá</p>
                        </div>
                    </div>
                    <Link to="/admin">
                        <Button variant="ghost" className="text-white hover:bg-white/20">
                            <Home className="h-4 w-4 mr-2" /> Dashboard
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Nội dung chính */}
            <div className="container mx-auto px-6 py-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Input
                        placeholder="Tìm id / priceType / mô tả..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-72"
                    />
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        {loading ? "Đang tải..." : "Tải lại"}
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Danh sách giá hệ thống</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Price Type</TableHead>
                                        <TableHead className="w-40">Giá</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead className="w-48">Created</TableHead>
                                        <TableHead className="w-48">Updated</TableHead>
                                        <TableHead className="w-28">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>#{row.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">
                                                    {row.priceType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                {formatPrice(Number(row.price || 0))}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {row.description || "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {fmtDateTimeVN(row.createdDate)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {fmtDateTimeVN(row.updatedDate)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEdit(row)}
                                                    className="gap-1"
                                                >
                                                    <Edit className="h-4 w-4" /> Sửa
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {!filteredRows.length && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Cập nhật giá hệ thống</DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label>ID</Label>
                                    <Input value={editingItem.id} disabled />
                                </div>
                                <div>
                                    <Label>Price Type</Label>
                                    <Input value={editingItem.priceType} disabled />
                                </div>
                            </div>

                            <div>
                                <Label>Giá mới *</Label>
                                <Input
                                    inputMode="numeric"
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                                    onBlur={() => {
                                        if (!priceInput) return;
                                        const n = parseInt(priceInput, 10);
                                        if (!isNaN(n)) setPriceInput(n.toLocaleString("vi-VN"));
                                    }}
                                    onFocus={() =>
                                        setPriceInput(String(priceInput).replace(/\D/g, ""))
                                    }
                                    placeholder="Nhập số tiền (VNĐ)"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Giá hiện tại:{" "}
                                    <span className="font-medium">
                                        {formatPrice(Number(editingItem.price || 0))}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <Label>Mô tả (tuỳ chọn)</Label>
                                <Textarea
                                    value={descInput}
                                    onChange={(e) => setDescInput(e.target.value)}
                                    placeholder="VD: Điều chỉnh theo thị trường..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleUpdate}
                                    disabled={submitting || !priceInput}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {submitting ? "Đang cập nhật..." : "Cập nhật"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
