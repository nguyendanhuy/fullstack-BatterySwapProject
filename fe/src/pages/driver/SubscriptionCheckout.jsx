import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Zap, Shield, CheckCircle, ArrowLeft, Crown, Star, Battery, Wallet } from "lucide-react";
import { SystemContext } from "../../contexts/system.context";
import {
    createInvoiceForSubscription,
    createVNpayForSubscription,
    checkVNPayPaymentStatus
} from "../../services/axios.services";

const currencyVN = (n) => (Number(n || 0)).toLocaleString("vi-VN");

export default function SubscriptionCheckout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { userData } = useContext(SystemContext);

    // Receive selected plan via navigation state or query string
    const planFromState = location.state?.plan || null;
    const pendingInvoice = location.state?.pendingInvoice || null;

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
    const [paymentMethod, setPaymentMethod] = useState("VNPAY"); // "VNPAY" or "WALLET"

    const priceNumber = useMemo(() => Number(String(plan?.price || "0").replace(/[^0-9]/g, "")), [plan]);

    // Helpers
    const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
    const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business);

    // Handle VNPay return
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const vnpTxnRef = urlParams.get('vnp_TxnRef');
        if (vnpTxnRef) handleVNPayReturn(vnpTxnRef);
    }, []);

    const handleVNPayReturn = async (txnRef) => {
        let retryCount = 0;

        const checkStatus = async () => {
            try {
                const paymentStatus = await checkVNPayPaymentStatus(txnRef);
                console.log("✅ VNPay payment status:", paymentStatus);

                // Retry if still pending
                if (retryCount < 5 && paymentStatus.paymentStatus === "PENDING") {
                    console.log(`⏳ Payment still pending, retry ${retryCount + 1}/5...`);
                    retryCount++;
                    setTimeout(checkStatus, 3000);
                    return;
                }

                if (paymentStatus.paymentStatus === "SUCCESS" || paymentStatus.vnpResponseCode === "00") {
                    toast({
                        title: "Thanh toán thành công!",
                        description: `Gói đã được kích hoạt. Số tiền: ${currencyVN(paymentStatus?.amount)} VNĐ`,
                        className: "bg-green-500 text-white",
                    });
                    setTimeout(() => navigate("/driver/subscriptions"), 2000);
                } else {
                    toast({
                        title: "Thanh toán thất bại!",
                        description: paymentStatus?.message || "Vui lòng thử lại hoặc liên hệ hỗ trợ",
                        variant: "destructive",
                    });
                    setTimeout(() => navigate("/driver/subscriptions"), 3000);
                }
            } catch (error) {
                console.error("❌ VNPay status check error:", error);
                toast({
                    title: "Lỗi kiểm tra thanh toán",
                    description: error?.message || "Vui lòng thử lại sau",
                    variant: "destructive"
                });
            }
        };

        checkStatus();
    };

    const redirectToVNPay = async (invoiceId) => {
        const vnpayResponse = await createVNpayForSubscription(invoiceId);
        console.log("✅ VNPay response:", vnpayResponse);

        if (isErrorResponse(vnpayResponse) || !vnpayResponse.paymentUrl) {
            toast({
                title: "Lỗi thanh toán",
                description: pickApiMessage(vnpayResponse),
                variant: "destructive",
            });
            setIsProcessing(false);
            return false;
        }

        toast({
            title: "Chuyển đến trang thanh toán...",
            className: "bg-blue-500 text-white",
        });

        setTimeout(() => window.location.href = vnpayResponse.paymentUrl, 1000);
        return true;
    };

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
            let invoiceId;

            // Check if there's a pending invoice for subscription
            if (pendingInvoice && pendingInvoice.invoiceId) {
                invoiceId = pendingInvoice.invoiceId;
                console.log("✅ Using existing pending invoice:", invoiceId);
            } else {
                // Create new invoice for subscription
                const invoiceResponse = await createInvoiceForSubscription(plan.id, userData.userId, paymentMethod);
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

                invoiceId = invoiceResponse.invoiceId;
            }

            // Handle payment based on method
            if (paymentMethod === "WALLET") {
                // Wallet payment is completed immediately
                toast({
                    title: "Thanh toán thành công!",
                    description: "Gói subscription đã được kích hoạt bằng ví hệ thống.",
                    className: "bg-green-500 text-white",
                });
                setTimeout(() => navigate("/driver/subscriptions"), 2000);
            } else if (paymentMethod === "VNPAY") {
                // Redirect to VNPay
                await redirectToVNPay(invoiceId);
            }

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
                                    Chọn phương thức thanh toán thuận tiện cho bạn
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* VNPay Option */}
                                    <button
                                        onClick={() => setPaymentMethod("VNPAY")}
                                        className={`w-full flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all ${paymentMethod === "VNPAY"
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <Label className="text-lg font-semibold text-gray-800 cursor-pointer">
                                                VNPay
                                            </Label>
                                            <p className="text-sm text-gray-600 mt-1">Hỗ trợ nhiều ngân hàng nội địa</p>
                                        </div>
                                        {paymentMethod === "VNPAY" && <CheckCircle className="h-6 w-6 text-blue-500" />}
                                    </button>

                                    {/* Wallet Option */}
                                    <button
                                        onClick={() => setPaymentMethod("WALLET")}
                                        className={`w-full flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all ${paymentMethod === "WALLET"
                                            ? "border-green-500 bg-green-50 shadow-md"
                                            : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                                            <Wallet className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <Label className="text-lg font-semibold text-gray-800 cursor-pointer">
                                                Ví hệ thống
                                            </Label>
                                            <p className="text-sm text-gray-600 mt-1">Thanh toán nhanh bằng số dư ví</p>
                                        </div>
                                        {paymentMethod === "WALLET" && <CheckCircle className="h-6 w-6 text-green-500" />}
                                    </button>
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
                                        disabled={isProcessing || !plan}
                                        className={`w-full rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 ${paymentMethod === "WALLET"
                                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                            } text-white`}
                                    >
                                        {paymentMethod === "WALLET" ? <Wallet className="h-5 w-5 mr-2" /> : <Zap className="h-5 w-5 mr-2" />}
                                        {isProcessing ? "Đang xử lý..." : paymentMethod === "WALLET" ? "Thanh toán bằng Ví" : "Thanh toán qua VNPay"}
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
