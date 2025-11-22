import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Shield, CheckCircle, ArrowLeft, Crown, Star, Battery, Wallet } from "lucide-react";
import { SystemContext } from "../../contexts/system.context";
import { createInvoiceForSubscription } from "../../services/axios.services";

const currencyVN = (n) => (Number(n || 0)).toLocaleString("vi-VN");

export default function SubscriptionCheckout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { userData, setUserData } = useContext(SystemContext);

    const planFromState = location.state?.plan || null;

    console.log("✅ Selected plan from state:", planFromState);

    const plan = planFromState;

    const priceNumber = Number(plan?.price || 0);


    const getIcon = (planIndex) => {
        switch (planIndex) {
            case 1: return Battery;
            case 2: return Star;
            case 3: return Crown;
            default: return Battery;
        }
    };

    const [isProcessing, setIsProcessing] = useState(false);

    // Helpers
    const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
    const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);

    const handlePayment = async () => {
        if (!plan) {
            toast({
                title: "Chưa chọn gói",
                description: "Vui lòng quay lại chọn gói trước khi thanh toán",
                variant: "destructive"
            });
            navigate("/driver/subscriptions");
            return;
        }

        if (!userData || !userData.userId) {
            toast({
                title: "Lỗi xác thực",
                description: "Vui lòng đăng nhập lại",
                variant: "destructive"
            });
            navigate("/login");
            return;
        }

        setIsProcessing(true);

        try {
            // Create invoice for subscription with WALLET payment
            const invoiceResponse = await createInvoiceForSubscription(plan.planId, userData.userId, "WALLET");
            console.log("✅ Invoice response:", invoiceResponse);

            if (isErrorResponse(invoiceResponse)) {
                toast({
                    title: "Tạo hóa đơn thất bại",
                    description: pickApiMessage(invoiceResponse),
                    variant: "destructive",
                });
                setIsProcessing(false);
                return;
            }

            toast({
                title: "Thanh toán thành công!",
                description: "Gói subscription đã được kích hoạt bằng ví hệ thống.",
                className: "bg-green-500 text-white",
            });

            navigate("/driver/subscriptions");
            setTimeout(() => {
                window.location.reload(); //reload
            }, 1000);
        } catch (err) {
            console.error("❌ Payment error:", err);
            toast({
                title: "Thanh toán thất bại!",
                description: err?.message || "Có lỗi xảy ra khi thanh toán",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-800">Đang xử lý...</h3>
                                <p className="text-sm text-gray-600">Vui lòng đợi trong giây lát</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div className="px-6 py-4 flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Thanh toán gói thuê pin</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left: Security Info */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
                            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                    Thanh toán bằng Ví hệ thống
                                </CardTitle>
                                <CardDescription className="text-gray-600 text-base">
                                    Thanh toán nhanh chóng và tiện lợi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-emerald-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Số dư ví hiện tại</p>
                                            <p className="text-3xl font-bold text-green-600 mt-1">
                                                {currencyVN(userData?.walletBalance)} VNĐ
                                            </p>
                                        </div>
                                        <Wallet className="h-12 w-12 text-green-500" />
                                    </div>
                                    {userData?.walletBalance < priceNumber && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                                            <p className="text-sm text-red-800">
                                                ⚠️ Số dư không đủ. Vui lòng nạp thêm tiền vào ví.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-white animate-slide-up">
                            <CardHeader>
                                <CardTitle className="flex items-center text-green-800">
                                    <Shield className="h-6 w-6 mr-2" />
                                    Bảo mật thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {["Mã hóa SSL 256-bit", "Tuân thủ chuẩn PCI DSS", "Không lưu trữ thông tin thẻ", "Xác thực 2 lớp"].map((f, i) => (
                                    <div key={i} className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                        <span className="text-gray-700">{f}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Order Summary */}
                    <div>
                        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in sticky top-6">
                            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                                        {(() => {
                                            const IconComponent = getIcon(plan?.planId);
                                            return <IconComponent className="h-6 w-6 text-white" />;
                                        })()}
                                    </div>
                                    Xác nhận đơn hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Plan card */}
                                {plan ? (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-emerald-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-lg font-bold text-gray-800">Gói {plan.planName}</div>
                                                <div className="text-sm text-gray-600">Chu kỳ: theo 1 tháng</div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800">Gói {plan.planId}</Badge>
                                        </div>
                                        <div className="mt-3 text-3xl font-bold  text-green-600">{currencyVN(priceNumber)} VNĐ</div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                                        Bạn chưa chọn gói. Vui lòng quay lại chọn gói trước khi thanh toán.
                                    </div>
                                )}

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Tổng thanh toán:</span>
                                        <span className="text-blue-600">{currencyVN(priceNumber)} VNĐ</span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !plan || (userData?.walletBalance < priceNumber)}
                                        className="w-full rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                    >
                                        <Wallet className="h-5 w-5 mr-2" />
                                        {isProcessing ? "Đang xử lý..." : "Thanh toán bằng Ví"}
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate("/driver/subscriptions")} className="w-full border-2 rounded-xl">
                                        Quay lại chọn gói
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
