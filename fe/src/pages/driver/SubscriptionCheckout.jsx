import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Zap, Shield, CheckCircle, ArrowLeft, Crown, Star, Battery } from "lucide-react";
import { createVNPayUrl, checkVNPayPaymentStatus } from "@/services/axios.services";

const currencyVN = (n) => (Number(n || 0)).toLocaleString("vi-VN");

export default function SubscriptionCheckout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Receive selected plan via navigation state or query string
    const planFromState = location.state?.plan || null;
    const planFromQuery = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("plan");
        const name = params.get("name");
        const price = params.get("price");
        const period = params.get("period");
        if (!id || !name || !price) return null;
        return { id, name, price, period: period || "tháng", icon: Star, color: "from-green-500 to-emerald-500", bgColor: "from-green-50 to-emerald-50" };
    }, [location.search]);

    const plan = planFromState || planFromQuery;

    const [isProcessing, setIsProcessing] = useState(false);
    const [promo, setPromo] = useState("");
    const [discount, setDiscount] = useState(0);

    const priceNumber = useMemo(() => Number(String(plan?.price || "0").replace(/[^0-9]/g, "")), [plan]);
    const total = Math.max(priceNumber - discount, 0);

    // Handle VNPay return in the same page (unified)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const vnpTxnRef = urlParams.get('vnp_TxnRef');
        if (vnpTxnRef) handleVNPayReturn(vnpTxnRef);
    }, []);

    const handleVNPayReturn = async (txnRef) => {
        try {
            const paymentStatus = await checkVNPayPaymentStatus(txnRef);
            const isSuccess = paymentStatus?.paymentStatus === "SUCCESS" || paymentStatus?.vnpResponseCode === "00";

            toast({
                title: isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại!",
                description: isSuccess
                    ? `Đơn đăng ký gói đã được kích hoạt. Số tiền: ${currencyVN(paymentStatus?.amount)} VNĐ`
                    : paymentStatus?.message || "Vui lòng thử lại hoặc liên hệ hỗ trợ",
                className: isSuccess ? "bg-green-500 text-white" : undefined,
                variant: isSuccess ? undefined : "destructive",
                duration: 5000,
            });

            setTimeout(() => navigate("/driver/subscriptions"), isSuccess ? 2000 : 3000);
        } catch (error) {
            toast({ title: "Lỗi kiểm tra thanh toán", description: String(error?.message || error), variant: "destructive" });
        }
    };

    const applyPromo = () => {
        // Simple local promo simulation (replace by API later)
        if (!promo) return setDiscount(0);
        if (promo.trim().toUpperCase() === "SAVE10") setDiscount(Math.round(priceNumber * 0.1));
        else if (promo.trim().toUpperCase() === "SAVE50K") setDiscount(50000);
        else setDiscount(0);
    };

    const proceedVNPay = async () => {
        if (!plan) {
            toast({ title: "Chưa chọn gói", description: "Vui lòng quay lại chọn gói trước khi thanh toán", variant: "destructive" });
            return navigate("/driver/subscriptions");
        }

        try {
            setIsProcessing(true);
            // For now, use generic VNPay create with amount and order info for subscription
            const payload = {
                amount: total,
                orderType: "SUBSCRIPTION",
                description: `Thanh toán gói ${plan.name} (${plan.id})`,
                bankCode: "VNPAY",
            };
            const vnp = await createVNPayUrl(payload);
            if (vnp?.error || vnp?.status === 400 || !vnp?.paymentUrl) {
                throw new Error(vnp?.messages?.business || vnp?.error || "Không tạo được liên kết VNPay");
            }

            toast({ title: "Chuyển đến VNPay...", className: "bg-blue-600 text-white" });
            setTimeout(() => { window.location.href = vnp.paymentUrl; }, 700);
        } catch (err) {
            toast({ title: "Không thể tạo thanh toán", description: String(err?.message || err), variant: "destructive" });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen">
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
                    {/* Left: Methods + Security */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in">
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                                        <CreditCard className="h-6 w-6 text-white" />
                                    </div>
                                    Phương thức thanh toán
                                </CardTitle>
                                <CardDescription className="text-gray-600 text-base">
                                    Thanh toán an toàn qua cổng VNPay
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4 p-6 border-2 rounded-2xl border-blue-500 bg-blue-50 shadow-md">
                                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-gray-800">VNPay</p>
                                            <p className="text-sm text-gray-600 mt-1">Hỗ trợ nhiều ngân hàng nội địa</p>
                                        </div>
                                        <CheckCircle className="h-6 w-6 text-blue-500" />
                                    </div>
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
                                        {plan?.icon ? <plan.icon className="h-6 w-6 text-white" /> : <Battery className="h-6 w-6 text-white" />}
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
                                                <div className="text-lg font-bold text-gray-800">{plan.name}</div>
                                                <div className="text-sm text-gray-600">Chu kỳ: {plan.period || "tháng"}</div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800">Gói {plan.id}</Badge>
                                        </div>
                                        <div className="mt-3 text-3xl font-extrabold text-emerald-600">{currencyVN(priceNumber)} VNĐ</div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                                        Bạn chưa chọn gói. Vui lòng quay lại chọn gói trước khi thanh toán.
                                    </div>
                                )}

                                {/* Promo */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-700">Mã khuyến mãi</label>
                                    <div className="flex gap-2">
                                        <Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Nhập mã (VD: SAVE10)" className="rounded-xl" />
                                        <Button variant="outline" onClick={applyPromo} className="rounded-xl">Áp dụng</Button>
                                    </div>
                                    {!!discount && (
                                        <div className="text-sm text-emerald-700">Đã áp dụng giảm {currencyVN(discount)} VNĐ</div>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Giá gói:</span>
                                        <span className="font-semibold">{currencyVN(priceNumber)} VNĐ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Giảm giá:</span>
                                        <span className="font-semibold text-emerald-600">- {currencyVN(discount)} VNĐ</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Tổng thanh toán:</span>
                                        <span className="text-blue-600">{currencyVN(total)} VNĐ</span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button
                                        onClick={proceedVNPay}
                                        disabled={isProcessing || !plan}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                                    >
                                        <Zap className="h-5 w-5 mr-2" />
                                        {isProcessing ? "Đang xử lý..." : "Thanh toán qua VNPay"}
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
