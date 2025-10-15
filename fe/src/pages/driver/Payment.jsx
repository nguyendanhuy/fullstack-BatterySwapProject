import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, QrCode, Wallet, Home, Zap, Shield, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState("full");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    holderName: ""
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePayment = () => {
    if (selectedMethod === "card") {
      setShowCardForm(true);
    } else {
      processPayment();
    }
  };

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
  };

  const processPayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Thanh toán thành công!",
        description: "Bạn có thể xem QR đổi pin tại phần lịch sử đặt chỗ",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/driver");
      }, 2000);
    }, 2000);
  };

  const handleCardPayment = (e) => {
    e.preventDefault();
    processPayment();
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Thanh toán</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
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
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="space-y-4">
                    {[
                      { value: "card", icon: CreditCard, label: "Thẻ tín dụng/ghi nợ", desc: "Visa, Mastercard, JCB", color: "from-blue-500 to-indigo-500" },
                      { value: "wallet", icon: Wallet, label: "Ví điện tử", desc: "MoMo, ZaloPay, ViettelPay", color: "from-green-500 to-emerald-500" },
                      // { value: "qr", icon: QrCode, label: "QR Banking", desc: "Quét mã QR để thanh toán", color: "from-purple-500 to-pink-500" }
                    ].map((method) => (
                      <div key={method.value}>
                        <div
                          className={`flex items-center space-x-4 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedMethod === method.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => {
                            setSelectedMethod(method.value);
                            if (method.value !== "wallet") {
                              setSelectedWallet(null);
                            }
                          }}
                        >
                          <RadioGroupItem value={method.value} id={method.value} className="w-5 h-5" />
                          <div className={`p-3 bg-gradient-to-r ${method.color} rounded-xl`}>
                            <method.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={method.value} className="text-lg font-semibold text-gray-800 cursor-pointer">
                              {method.label}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{method.desc}</p>
                          </div>
                          {selectedMethod === method.value && (
                            <CheckCircle className="h-6 w-6 text-blue-500" />
                          )}
                        </div>

                        {/* E-wallet options */}
                        {method.value === "wallet" && selectedMethod === "wallet" && (
                          <div className="ml-4 mt-4 space-y-3 animate-slide-up">
                            {[
                              { name: "MoMo", color: "from-pink-500 to-rose-500" },
                              { name: "ZaloPay", color: "from-blue-500 to-cyan-500" },
                              { name: "ViettelPay", color: "from-red-500 to-orange-500" }
                            ].map((wallet) => (
                              <div
                                key={wallet.name}
                                onClick={() => handleWalletSelect(wallet.name)}
                                className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${selectedWallet === wallet.name
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <div className={`p-2 bg-gradient-to-r ${wallet.color} rounded-lg`}>
                                  <Wallet className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-semibold text-gray-800">{wallet.name}</span>
                                {selectedWallet === wallet.name && (
                                  <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-0 shadow-lg bg-white animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Shield className="h-6 w-6 mr-2" />
                  Bảo mật thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Mã hóa SSL 256-bit",
                  "Tuân thủ chuẩn PCI DSS",
                  "Không lưu trữ thông tin thẻ",
                  "Xác thực 2 lớp"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary or QR Code */}
          <div>
            {selectedWallet ? (
              /* QR Code Card */
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in sticky top-6">
                <div className={`h-2 bg-gradient-to-r ${selectedWallet === "MoMo" ? "from-pink-500 to-rose-500" :
                  selectedWallet === "ZaloPay" ? "from-blue-500 to-cyan-500" :
                    "from-red-500 to-orange-500"
                  }`}></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className={`p-3 bg-gradient-to-r ${selectedWallet === "MoMo" ? "from-pink-500 to-rose-500" :
                      selectedWallet === "ZaloPay" ? "from-blue-500 to-cyan-500" :
                        "from-red-500 to-orange-500"
                      } rounded-xl mr-4`}>
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    Thanh toán qua {selectedWallet}
                  </CardTitle>
                  <CardDescription>
                    Quét mã QR bằng ứng dụng {selectedWallet}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code Display */}
                  <div className="flex justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg border-4 border-gray-200">
                        <QrCode className="h-32 w-32 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold text-lg text-blue-600">150,000 VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ví:</span>
                      <span className="font-semibold text-gray-800">{selectedWallet}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nội dung:</span>
                      <span className="font-semibold text-gray-800">EVSWAP DOI PIN</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Hướng dẫn thanh toán:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-600">
                      <li>Mở ứng dụng {selectedWallet}</li>
                      <li>Chọn chức năng quét mã QR</li>
                      <li>Quét mã QR phía trên</li>
                      <li>Xác nhận thanh toán 150,000 VNĐ</li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 pt-6">
                    <Button
                      onClick={processPayment}
                      disabled={isProcessing}
                      className={`w-full bg-gradient-to-r ${selectedWallet === "MoMo" ? "from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700" :
                        selectedWallet === "ZaloPay" ? "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" :
                          "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        } text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50`}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {isProcessing ? "Đang xử lý..." : "Đã thanh toán"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setSelectedWallet(null)}
                      className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Đổi phương thức thanh toán
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Payment Details Card */
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in sticky top-6">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    Chi tiết thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 pb-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trạm:</span>
                      <span className="font-semibold text-gray-800">Trạm Quận 1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ngày giờ:</span>
                      <span className="font-semibold text-gray-800">15/12/2024 - 14:30</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dịch vụ:</span>
                      <Badge className="bg-blue-100 text-blue-800">Đổi pin nhanh</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Phí dịch vụ:</span>
                      <span className="font-semibold text-gray-800">150,000 VNĐ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Phí xử lý:</span>
                      <span className="font-semibold text-gray-800">0 VNĐ</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-gray-800">Tổng thanh toán:</span>
                      <span className="text-blue-600">150,000 VNĐ</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      {isProcessing ? "Đang xử lý..." : "Thanh toán & Nhận QR"}
                    </Button>

                    <Link to="/driver" className="block">
                      <Button variant="outline" className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105">
                        <Home className="h-5 w-5 mr-2" />
                        Về Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Credit Card Form Modal */}
        {showCardForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
                  Thông tin thẻ tín dụng
                </CardTitle>
                <CardDescription>
                  Nhập thông tin thẻ để hoàn tất thanh toán
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Số thẻ</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="holderName">Tên chủ thẻ</Label>
                    <Input
                      id="holderName"
                      placeholder="NGUYEN VAN A"
                      value={cardDetails.holderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, holderName: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Ngày hết hạn</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCardForm(false)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isProcessing ? "Đang xử lý..." : "Tiến hành thanh toán"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default Payment;
