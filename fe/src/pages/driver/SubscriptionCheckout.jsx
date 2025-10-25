import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Zap, Shield, CheckCircle, ArrowLeft, Crown, Star, Battery } from "lucide-react";
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
    const [loadingStep, setLoadingStep] = useState("");

    const priceNumber = useMemo(() => Number(String(plan?.price || "0").replace(/[^0-9]/g, "")), [plan]);

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
                        duration: 5000,
                    });
                    setTimeout(() => navigate("/driver/subscriptions"), 2000);
                } else {
                    toast({
                        title: "Thanh toán thất bại!",
                        description: paymentStatus?.message || "Vui lòng thử lại hoặc liên hệ hỗ trợ",
                        variant: "destructive",
                        duration: 5000,
                    });
                    setTimeout(() => navigate("/driver/subscriptions"), 3000);
                }
            } catch (error) {
                console.error("❌ VNPay status check error:", error);
                toast({
                    title: "Lỗi kiểm tra thanh toán",
                    description: String(error?.message || error),
                    variant: "destructive"
                });
            }
        };

        checkStatus();
    };

    const showError = (title, description, duration = 5000) => {
        setLoadingStep("");
        toast({ title, description, variant: "destructive", duration });
    };

    const redirectToVNPay = async (invoiceId) => {
        setLoadingStep("Đang tạo liên kết thanh toán...");
        const vnpayResponse = await createVNpayForSubscription(invoiceId);
        console.log("✅ VNPay response:", vnpayResponse);

        if (vnpayResponse.error || vnpayResponse.status === 400 || !vnpayResponse.paymentUrl) {
            throw new Error(vnpayResponse.messages?.business || vnpayResponse.error || "Lỗi tạo thanh toán");
        }

        toast({
            title: "Chuyển đến trang thanh toán...",
            className: "bg-blue-500 text-white",
        });

        setTimeout(() => window.location.href = vnpayResponse.paymentUrl, 1000);
    };

    const proceedVNPay = async () => {
        if (!plan) {
            toast({ title: "Chưa chọn gói", description: "Vui lòng quay lại chọn gói trước khi thanh toán", variant: "destructive" });
            return navigate("/driver/subscriptions");
        }

        if (!userData || !userData.userId) {
            toast({ title: "Lỗi xác thực", description: "Vui lòng đăng nhập lại", variant: "destructive" });
            return navigate("/login");
        }

        try {
            setIsProcessing(true);

            let invoiceId;

            // Check if there's a pending invoice for subscription
            if (pendingInvoice && pendingInvoice.invoiceId) {
                invoiceId = pendingInvoice.invoiceId;
                console.log("✅ Using existing pending invoice:", invoiceId);
            } else {
                // Step 1: Create new invoice for subscription
                setLoadingStep("Đang tạo hóa đơn...");
                const invoiceResponse = await createInvoiceForSubscription(plan.id, userData.userId);
                console.log("✅ Invoice response:", invoiceResponse);

                if (!invoiceResponse.success || !invoiceResponse.invoiceId) {
                    throw new Error(invoiceResponse?.message || invoiceResponse?.error || "Không tạo được hóa đơn");
                }
                invoiceId = invoiceResponse.invoiceId;
            }

            // Step 2: Redirect to VNPay
            await redirectToVNPay(invoiceId);

        } catch (err) {
            showError("Không thể tạo thanh toán", err?.message || String(err));
            setIsProcessing(false);
        }
    };

    const LoadingStep = ({ step, label, active }) => (
        <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${active ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50"}`}>
            <div className={`w-2 h-2 rounded-full ${active ? "bg-blue-600 animate-pulse" : "bg-gray-400"}`}></div>
            <span className={`text-sm font-medium ${active ? "text-blue-600" : "text-gray-500"}`}>{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen">
            {/* Loading Overlay */}
            {isProcessing && loadingStep && (
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
                                <h3 className="text-xl font-bold text-gray-800">{loadingStep}</h3>
                                <p className="text-sm text-gray-600">Quá trình này sẽ mất vài giây...</p>
                            </div>
                            <div className="w-full space-y-2">
                                <LoadingStep label="Tạo hóa đơn" active={loadingStep.includes("hóa đơn")} />
                                <LoadingStep label="Chuyển đến thanh toán" active={loadingStep.includes("liên kết") || loadingStep.includes("chuyển")} />
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

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Tổng thanh toán:</span>
                                        <span className="text-blue-600">{currencyVN(priceNumber)} VNĐ</span>
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
