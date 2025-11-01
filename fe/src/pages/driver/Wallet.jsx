import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Wallet as WalletIcon,
    Home,
    CreditCard,
    ArrowUpCircle,
    TrendingUp,
    Banknote,
    CheckCircle,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { depositSystemWallet, getInfoByToken, checkVNPayPaymentStatus } from "../../services/axios.services";
import { SystemContext } from "../../contexts/system.context";

const Wallet = () => {
    const navigate = useNavigate();
    const { userData } = useContext(SystemContext);

    const [amount, setAmount] = useState("");
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);

    // Suggested amounts
    const suggestedAmounts = [
        { value: 50000, label: "50.000 ₫" },
        { value: 100000, label: "100.000 ₫" },
        { value: 200000, label: "200.000 ₫" },
        { value: 500000, label: "500.000 ₫" },
        { value: 1000000, label: "1.000.000 ₫" },
        { value: 2000000, label: "2.000.000 ₫" },
    ];

    // // Load wallet balance
    // useEffect(() => {
    //     const fetchWalletBalance = async () => {
    //         try {
    //             const data = await getInfoByToken();
    //             console.log("✅ Fetched wallet balance:", data?.walletBalance);
    //             setWalletBalance(data?.walletBalance || 0);
    //         } catch (error) {
    //             console.error("❌ Fetch wallet balance error:", error);
    //         }
    //     };

    //     fetchWalletBalance();
    // }, []);

    // Handle amount selection
    const handleSelectAmount = (value) => {
        setSelectedAmount(value);
        setAmount(value.toString());
    };

    // Handle custom amount input
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Only numbers
        setAmount(value);
        setSelectedAmount(null);
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    // Handle deposit
    const handleDeposit = async () => {
        const depositAmount = parseInt(amount);

        // Validation
        if (!amount || depositAmount <= 0) {
            toast.error("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        if (depositAmount < 10000) {
            toast.error("Số tiền nạp tối thiểu là 10.000 ₫");
            return;
        }

        setIsProcessing(true);

        try {
            const data = await depositSystemWallet(depositAmount);
            console.log("✅ Deposit response:", data);

            if (data?.success && data?.paymentUrl) {
                toast.success("Đang chuyển đến cổng thanh toán...");

                // Redirect to VNPay
                setTimeout(() => {
                    window.location.href = data.paymentUrl;
                }, 500);
            } else {
                toast.error(data?.message || "Không thể tạo link thanh toán");
                setIsProcessing(false);
            }
        } catch (error) {
            console.error("❌ Deposit error:", error);
            toast.error(error?.message || "Có lỗi xảy ra khi nạp tiền");
            setIsProcessing(false);
        }
    };

    // Handle VNPay return (after payment) with retry mechanism
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const vnpTxnRef = urlParams.get('vnp_TxnRef');

        if (vnpTxnRef) {
            handleVNPayReturn(vnpTxnRef);
        }
    }, []);

    const handleVNPayReturn = async (txnRef) => {
        let retryCount = 0;

        const checkStatus = async () => {
            try {
                const paymentStatus = await checkVNPayPaymentStatus(txnRef);
                console.log("✅ VNPay payment status:", paymentStatus);

                // Nếu vẫn PENDING do get kết quả sớm hơn vnpay trả thì retry đợi vnpay
                if (retryCount < 5 && paymentStatus.paymentStatus === "PENDING") {
                    console.log(`⏳ Payment still pending, retry ${retryCount + 1}/5...`);
                    retryCount++;
                    setTimeout(checkStatus, 3000);
                    return;
                }

                // Clear URL params
                window.history.replaceState({}, document.title, window.location.pathname);

                if (paymentStatus.paymentStatus === "SUCCESS" || paymentStatus.vnpResponseCode === "00") {
                    const amountPaid = paymentStatus.amount || 0;
                    toast.success(`Nạp tiền thành công ${formatCurrency(amountPaid)}!`, {
                        duration: 7000,
                        icon: <CheckCircle className="h-5 w-5 text-green-500" />
                    });

                    // Reload wallet balance after short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                } else {
                    toast.error(paymentStatus.message || "Thanh toán thất bại hoặc đã bị hủy", {
                        duration: 5000,
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />
                    });
                }
            } catch (error) {
                console.error("❌ VNPay status check error:", error);
                // Retry nếu lỗi network
                if (retryCount < 5) {
                    console.log(`⏳ Error occurred, retry ${retryCount + 1}/5...`);
                    retryCount++;
                    setTimeout(checkStatus, 3000);
                } else {
                    toast.error("Không thể kiểm tra trạng thái thanh toán. Vui lòng kiểm tra lại sau.", {
                        duration: 5000,
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />
                    });
                }
            }
        };

        checkStatus();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <WalletIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Ví điện tử</h1>
                            <p className="text-blue-100 text-sm">Nạp tiền vào tài khoản</p>
                        </div>
                    </div>
                    <Link to="/driver">
                        <Button variant="ghost" className="text-white hover:bg-white/20">
                            <Home className="h-4 w-4 mr-2" /> Trang chủ
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="container mx-auto p-6 max-w-4xl">
                {/* Current Balance Card */}
                <Card className="border-0 shadow-xl mb-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 opacity-10">
                        <WalletIcon className="h-48 w-48" />
                    </div>
                    <CardContent className="p-8 relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-2">Số dư khả dụng</p>
                                <h2 className="text-4xl font-bold tracking-tight mb-1">
                                    {formatCurrency(userData?.walletBalance)}
                                </h2>
                                <p className="text-green-100 text-xs flex items-center gap-1 mt-2">
                                    <TrendingUp className="h-3 w-3" />
                                    Tài khoản: {userData?.email || "Người dùng"}
                                </p>
                            </div>
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                                <Banknote className="h-12 w-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Deposit Form */}
                <Card className="border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <CardTitle className="flex items-center text-xl">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-md">
                                <ArrowUpCircle className="h-6 w-6 text-white" />
                            </div>
                            Nạp tiền vào ví
                        </CardTitle>
                        <CardDescription className="text-base">
                            Chọn hoặc nhập số tiền bạn muốn nạp vào tài khoản
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        {/* Suggested Amounts */}
                        <div>
                            <Label className="text-base font-semibold mb-3 block">Chọn nhanh số tiền</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {suggestedAmounts.map((item) => (
                                    <Button
                                        key={item.value}
                                        variant={selectedAmount === item.value ? "default" : "outline"}
                                        className={`h-16 text-base font-semibold transition-all ${selectedAmount === item.value
                                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                                            : "hover:border-blue-500 hover:bg-blue-50"
                                            }`}
                                        onClick={() => handleSelectAmount(item.value)}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount Input */}
                        <div>
                            <Label htmlFor="customAmount" className="text-base font-semibold mb-3 block">
                                Hoặc nhập số tiền khác
                            </Label>
                            <div className="relative">
                                <Input
                                    id="customAmount"
                                    type="text"
                                    placeholder="Nhập số tiền (VNĐ)"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="h-14 text-lg pl-4 pr-16 border-2 focus:border-blue-500"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                    ₫
                                </span>
                            </div>
                            {amount && (
                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Bạn sẽ nạp: <strong className="text-blue-600">{formatCurrency(parseInt(amount) || 0)}</strong>
                                </p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold text-blue-900">Thông tin thanh toán</p>
                                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
                                        <li>Thanh toán qua cổng VNPay an toàn, bảo mật</li>
                                        <li>Hỗ trợ thẻ ATM, thẻ tín dụng, QR Code</li>
                                        <li>Số tiền tối thiểu: 10.000 ₫</li>
                                        <li>Tiền sẽ được cộng vào ví ngay sau khi thanh toán thành công</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Deposit Button */}
                        <Button
                            onClick={handleDeposit}
                            disabled={!amount || parseInt(amount) <= 0 || isProcessing}
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <ArrowUpCircle className="h-5 w-5 mr-2" />
                                    Nạp tiền {amount ? formatCurrency(parseInt(amount)) : ""}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Bảo mật SSL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <span>VNPay Partner</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
