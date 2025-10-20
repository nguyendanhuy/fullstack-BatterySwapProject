// components/InvoiceDialog.jsx
import React, { useEffect, useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Battery, MapPin, Car, FileText, Building2, Phone, Mail } from "lucide-react";
import { getInvoiceById } from "../services/axios.services";
import { use } from "react";

/**
 * Props:
 * - open: boolean
 * - onOpenChange: (open:boolean) => void
 * - booking: { id, bookingTime, paymentTime, stationLocation, vehicleType, batteryType, amount } | null
 * - onDownload?: () => void
 */
export default function InvoiceDialog({ open, onOpenChange, booking, onDownload }) {
    const [invoice, setInvoice] = useState({});
    const getInvoice = async () => {
        try {
            const res = await getInvoiceById(booking.invoiceId);
            if (res) {
                console.log("Invoice data:", res);
                // setInvoice(res);
            } else if (res?.error) {
                toast.error("Lỗi gọi hóa đơn", { description: JSON.stringify(res.error) });
            }
        } catch (err) {
            toast.error("Lỗi mạng khi tải hóa đơn", { description: String(err?.message ?? err) });
        }
    };
    useEffect(() => {
        if (open && booking?.invoiceId) {
            getInvoice();
        }
    }, [booking])
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
                            <p className="font-semibold">HD{booking?.bookingId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Mã đặt chỗ</p>
                            <p className="font-semibold">{booking?.bookingId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Ngày đặt</p>
                            <p className="font-semibold">{booking?.bookingDate + booking?.timeSlot}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Ngày thanh toán</p>
                            <p className="font-semibold">{booking?.paymentTime}</p>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                            <div className="h-1 w-1 bg-blue-500 rounded-full mr-2"></div>
                            Chi tiết dịch vụ
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-blue-100 dark:border-slate-700">
                                <MapPin className="h-4 w-4 mr-2 mt-1 text-blue-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Địa điểm</p>
                                    <p className="font-medium text-sm">{booking?.stationAddress}</p>
                                </div>
                            </div>
                            <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-green-100 dark:border-slate-700">
                                <Car className="h-4 w-4 mr-2 mt-1 text-green-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Phương tiện</p>
                                    <p className="font-medium text-sm">{booking?.vehicleType}</p>
                                </div>
                            </div>
                            <div className="flex items-start p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-orange-100 dark:border-slate-700">
                                <Battery className="h-4 w-4 mr-2 mt-1 text-orange-500 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Loại pin</p>
                                    <p className="font-medium text-sm">{booking?.batteryType}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="border-t border-blue-200/50 dark:border-slate-700 pt-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-slate-800/30 dark:to-slate-700/30 rounded-lg p-4 backdrop-blur-sm">
                        <h4 className="font-semibold mb-3 flex items-center">
                            <div className="h-1 w-1 bg-green-500 rounded-full mr-2"></div>
                            Thông tin thanh toán
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Dịch vụ đặt trước pin</span>
                                <span className="font-medium">{booking?.amount} VNĐ</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Phí dịch vụ</span>
                                <span className="font-medium">0 VNĐ</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT (0%)</span>
                                <span className="font-medium">0 VNĐ</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">Tổng cộng</span>
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-green-600">{booking?.amount} VNĐ</p>
                                        <Badge variant="default" className="mt-1 bg-green-500">Đã thanh toán</Badge>
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

                <DialogFooter className="border-t border-blue-200/50 dark:border-slate-700 pt-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Đóng
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        onClick={onDownload}>
                        <FileText className="h-4 w-4 mr-2" />
                        Tải xuống
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
