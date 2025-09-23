import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, QrCode, Wallet, Home } from "lucide-react";
import { Link } from "react-router-dom";

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState("full");
  const [selectedMethod, setSelectedMethod] = useState("card");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CreditCard className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Thanh toán</h1>
          </div>
          <Link to="/driver/reservation">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">

            {/* Payment Methods */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Thẻ tín dụng/ghi nợ
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="flex items-center">
                        <Wallet className="h-5 w-5 mr-2" />
                        Ví điện tử (MoMo, ZaloPay)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="qr" id="qr" />
                      <Label htmlFor="qr" className="flex items-center">
                        <QrCode className="h-5 w-5 mr-2" />
                        QR Banking
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card className="animate-scale-in sticky top-6">
              <CardHeader>
                <CardTitle>Chi tiết thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạm:</span>
                    <span>Trạm Quận 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày giờ:</span>
                    <span>15/12/2024 - 14:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dịch vụ:</span>
                    <span>Đổi pin</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Phí dịch vụ:</span>
                    <span>150,000 VNĐ</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Số tiền thanh toán:</span>
                    <span className="text-electric-blue">150,000 VNĐ</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button className="w-full" size="lg">
                    Thanh toán & Nhận QR
                  </Button>
                  
                  <Link to="/driver" className="block">
                    <Button variant="outline" className="w-full" size="lg">
                      <Home className="h-4 w-4 mr-2" />
                      Về Dashboard
                    </Button>
                  </Link>
                  
                  <div className="text-center p-4 bg-electric-blue-light rounded-lg">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-electric-blue" />
                    <p className="text-sm font-medium">QR Code sẽ được tạo sau khi thanh toán</p>
                    <p className="text-xs text-muted-foreground">Xuất trình QR này tại trạm để đổi pin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;