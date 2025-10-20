// components/InvoiceDialog.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Battery, MapPin, Car, FileText, Building2, Phone, Mail, CreditCard } from "lucide-react";
import { getInvoicebyUserId } from "../services/axios.services";
import { SystemContext } from "../contexts/system.context";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";
export default function InvoiceDialog({ open, onOpenChange, booking, onDownload }) {
    const { userData } = useContext(SystemContext);
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        const run = async () => {
            if (!open || !booking?.invoiceId || !userData?.userId) return;
            setLoading(true);
            try {
                const res = await getInvoicebyUserId(userData.userId);
                if (res && Array.isArray(res?.invoices)) {
                    console.log("Fetched invoices:", res);
                    const inv = res.invoices.find(i => i.invoiceId === Number(booking.invoiceId));
                    setInvoice(inv ?? null);
                    if (!inv) {
                        toast({
                            title: "Không tìm thấy hóa đơn",
                            description: `Không có hóa đơn #${booking.invoiceId} cho người dùng này.`,
                            variant: "destructive",
                        });
                    }
                } else {
                    toast({
                        title: "Lỗi tải hóa đơn",
                        description: "API trả về dữ liệu không hợp lệ.",
                        variant: "destructive",
                    });
                    setInvoice(null);
                }
            } catch (err) {
                toast({
                    title: "Lỗi mạng khi tải hóa đơn",
                    description: String(err?.message ?? err),
                    variant: "destructive",
                });
                setInvoice(null);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [open, booking?.invoiceId, userData?.userId]);

    const mainBooking = useMemo(() => {
        if (!invoice?.bookings) return null;
        return invoice.bookings.find(b => b.bookingId === booking?.bookingId) ?? null;
    }, [invoice, booking?.bookingId]);

    const otherBookings = useMemo(() => {
        if (!invoice?.bookings) return [];
        return invoice.bookings.filter(b => b.bookingId !== booking?.bookingId);
    }, [invoice, booking?.bookingId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <DialogHeader className="border-b border-blue-200/50 dark:border-slate-700 pb-4">
                    <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        HÓA ĐƠN THANH TOÁN
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        Dịch vụ đặt trước pin thay thế
                    </DialogDescription>
                </DialogHeader>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col justify-center items-center py-10">
                        <Spin size="large" />
                        <p className="mt-2 text-sm text-muted-foreground">Đang tải hóa đơn...</p>
                    </div>
                )}

                {/* Không có dữ liệu */}
                {!loading && !invoice && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Không có dữ liệu hóa đơn để hiển thị.
                    </div>
                )}

                {/* Nội dung chính */}
                {!loading && invoice && (
                    <div className="space-y-6 py-4">
                        {/* Company Info */}
                        <div className="text-center border-b border-blue-200/50 dark:border-slate-700 pb-4 bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-center mb-2">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                                    <Battery className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg">CÔNG TY TNHH ĐỔI PIN NHANH</h3>
                            <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
                                <Building2 className="h-3 w-3 mr-1" />
                                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
                            </div>
                            <div className="flex items-center justify-center text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>1900-xxxx</span>
                                <span className="mx-2">|</span>
                                <Mail className="h-3 w-3 mr-1" />
                                <span>support@batteryswap.vn</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">MST: 0123456789</p>
                        </div>

                        {/* Invoice Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg backdrop-blur-sm border border-blue-200/30 dark:border-slate-700/30">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Số hóa đơn</p>
                                <p className="font-semibold">HD{invoice.invoiceId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Người dùng</p>
                                <p className="font-semibold">{invoice.userId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Ngày tạo</p>
                                <p className="font-semibold">{invoice.createdDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Số lượt đổi</p>
                                <p className="font-semibold">{invoice.numberOfSwaps}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Đơn giá / lượt</p>
                                <p className="font-semibold">{invoice.pricePerSwap?.toLocaleString()} VNĐ</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Trạng thái hóa đơn</p>
                                <Badge className={invoice.invoiceStatus === "PAID" ? "bg-green-500" : ""}>
                                    {invoice.invoiceStatus}
                                </Badge>
                            </div>
                        </div>

                        {/* Booking chính */}
                        {mainBooking && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center">
                                        <div className="h-1 w-1 bg-blue-500 rounded-full mr-2"></div>
                                        Chi tiết booking chính
                                    </h4>
                                    <Badge variant="default" className="bg-blue-600">
                                        Booking #{mainBooking.bookingId}
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-blue-100 dark:border-slate-700">
                                        <MapPin className="h-4 w-4 mr-2 mt-1 text-blue-500 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Trạm</p>
                                            <p className="font-semibold text-sm">{mainBooking.stationName}</p>
                                            <p className="text-xs text-muted-foreground">{mainBooking.stationAddress}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-green-100 dark:border-slate-700">
                                        <Car className="h-4 w-4 mr-2 mt-1 text-green-500 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Phương tiện</p>
                                            <p className="font-medium text-sm">{mainBooking.vehicleType} — {mainBooking.licensePlate}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-orange-100 dark:border-slate-700">
                                        <Battery className="h-4 w-4 mr-2 mt-1 text-orange-500 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Loại pin</p>
                                            <p className="font-medium text-sm">{mainBooking.vehicleBatteryType}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700">
                                        <div className="text-sm text-muted-foreground">
                                            {mainBooking.bookingDate} {mainBooking.timeSlot?.slice(0, 5)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-emerald-600" />
                                            <div className="font-bold text-emerald-600">
                                                {mainBooking.amount?.toLocaleString()} VNĐ
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Các booking khác */}
                        {otherBookings.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center">
                                    <div className="h-1 w-1 bg-slate-500 rounded-full mr-2"></div>
                                    Các booking khác trong hóa đơn
                                </h4>
                                <div className="space-y-2">
                                    {otherBookings.map((b) => (
                                        <div key={b.bookingId} className="flex items-center justify-between rounded-lg border bg-white/60 dark:bg-slate-800/60 px-3 py-2">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-semibold">#BK{b.bookingId} • {b.vehicleType}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {b.bookingDate} {b.timeSlot?.slice(0, 5)} • {b.licensePlate}
                                                </span>
                                            </div>
                                            <div className="text-right text-sm font-semibold">
                                                {b.amount?.toLocaleString()} VNĐ
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Summary */}
                        <div className="border-t border-blue-200/50 dark:border-slate-700 pt-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-slate-800/30 dark:to-slate-700/30 rounded-lg p-4 backdrop-blur-sm">
                            <h4 className="font-semibold mb-3 flex items-center">
                                <div className="h-1 w-1 bg-green-500 rounded-full mr-2"></div>
                                Thông tin thanh toán
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Đơn giá / lượt</span>
                                    <span className="font-medium">{invoice.pricePerSwap?.toLocaleString()} VNĐ</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Số lượt</span>
                                    <span className="font-medium">{invoice.numberOfSwaps}</span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">Tổng cộng</span>
                                        <div className="text-right">
                                            <p className="font-bold text-2xl text-green-600">
                                                {invoice.totalAmount?.toLocaleString()} VNĐ
                                            </p>
                                            <Badge variant="default" className="mt-1 bg-green-500">
                                                {invoice.invoiceStatus ?? "PAID"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="border-t border-blue-200/50 dark:border-slate-700 pt-4 text-center bg-white/30 dark:bg-slate-800/30 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-xs text-muted-foreground italic">
                                Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Hóa đơn này được tạo tự động bởi hệ thống
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t border-blue-200/50 dark:border-slate-700 pt-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Đóng
                    </Button>
                    <Button
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        onClick={onDownload}
                        disabled={!invoice}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Tải xuống
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
