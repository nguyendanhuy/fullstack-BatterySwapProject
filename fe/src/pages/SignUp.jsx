import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Battery, Eye, EyeOff, User, Mail, Phone, MapPin, Loader2, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { registerAPI, getSystemPriceAdmin } from "../services/axios.services";
import { MouseSparkles } from "@/components/MouseSparkles";
import authBackground from "@/assets/auth-background.jpg";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    userType: 1,
    password: "",
    confirmPassword: "",
  });
  const [PENALTY_MINOR, setPENALTY_MINOR] = useState(0);
  const [PENALTY_MEDIUM, setPENALTY_MODERATE] = useState(0);
  const [PENALTY_SEVERE, setPENALTY_SEVERE] = useState(0);

  const getPenaltyPrices = async () => {
    try {
      const res = await getSystemPriceAdmin();
      setPENALTY_MINOR(res.find(p => p.id === 5).price);
      setPENALTY_MODERATE(res.find(p => p.id === 6).price);
      setPENALTY_SEVERE(res.find(p => p.id === 7).price);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lấy thông tin giá phạt từ hệ thống",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) localStorage.removeItem("token");
    getPenaltyPrices();
  }, []);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address ||
      !formData.userType || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    // Check terms acceptance
    if (!acceptedTerms) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đồng ý với điều khoản sử dụng",
        variant: "destructive",
      });
      return;
    }

    const nameRegex = /^[\p{L} ]+$/u;
    if (!nameRegex.test(formData.fullName)) {
      toast({
        title: "Lỗi",
        description: "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email hợp lệ",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: "Lỗi",
        description: "Số điện thoại phải có đúng 10 chữ số",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerAPI(
        formData.fullName,
        formData.email,
        formData.phone,
        formData.address,
        formData.password,
        formData.confirmPassword);

      const pickApiMessage =
        res?.messages?.auth ||
        res?.messages?.business ||
        res?.error ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại.';

      const isError =
        (typeof res?.status === 'number' && res?.status >= 400) ||
        !!res?.error ||
        !!res?.messages?.auth ||
        !!res?.messages?.business;

      if (!isError) {
        toast({
          title: "Đăng ký thành công!",
          description: (
            <div className="space-y-3">
              <p>Vui lòng kiểm tra email, hộp thư spam để xác thực tài khoản</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-green-600 hover:bg-gray-100 border-0"
                  onClick={() => {
                    window.open('https://mail.google.com', '_blank');
                  }}
                >
                  📧 Mở hộp thư
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-orange-600 hover:bg-gray-100 border-0"
                  onClick={() => {
                    window.open('https://mail.google.com/mail/u/0/#spam', '_blank');
                  }}
                >
                  🗑️ Mở Spam
                </Button>
              </div>
            </div>
          ),
          className: 'bg-green-500 text-white',
        });
        navigate("/login");
      } else {
        toast({
          title: "Đăng ký thất bại!",
          description: pickApiMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Đăng ký thất bại!",
        description: "Có lỗi xảy ra, vui lòng thử lại",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-cyan-900/80 backdrop-blur-sm" />
      <MouseSparkles />
      <Card className="relative w-full max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Battery className="h-8 w-8 text-electric-blue mr-2" />
            <span className="text-2xl font-bold text-electric-blue">EV Battery Swap</span>
          </div>
          <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tạo tài khoản mới để sử dụng hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" type="text" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="0123456789" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="address" type="text" placeholder="123 Đường ABC, Quận XYZ, TP.HCM" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu (ít nhất 6 ký tự)" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tôi đồng ý với{" "}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto font-semibold text-electric-blue"
                      >
                        Điều khoản sử dụng
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                          <FileText className="h-6 w-6 text-electric-blue" />
                          Điều Khoản Sử Dụng Dịch Vụ
                        </DialogTitle>
                        <DialogDescription>
                          Vui lòng đọc kỹ các điều khoản trước khi đăng ký
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 text-sm">
                        {/* 1. Giới thiệu */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">1. Giới Thiệu</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Chào mừng bạn đến với hệ thống thay pin xe điện EV Battery Swap.
                            Bằng việc đăng ký và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ
                            các điều khoản và điều kiện được nêu dưới đây.
                          </p>
                        </section>

                        {/* 2. Quyền và Nghĩa vụ của Người dùng */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">2. Quyền và Nghĩa Vụ Của Người Dùng</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Cung cấp thông tin chính xác và đầy đủ khi đăng ký tài khoản</li>
                            <li>Bảo mật thông tin tài khoản và không chia sẻ cho bên thứ ba</li>
                            <li>Tuân thủ quy định sử dụng dịch vụ và quy trình thay pin</li>
                            <li>Thanh toán đầy đủ các khoản phí theo quy định</li>
                            <li>Thông báo kịp thời khi phát hiện sự cố với pin hoặc dịch vụ</li>
                          </ul>
                        </section>

                        {/* 3. Chính sách về Pin */}
                        <section className="space-y-3">
                          <h3 className="font-bold text-lg text-electric-blue">3. Chính Sách Về Pin</h3>

                          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                            <h4 className="font-semibold text-amber-800 mb-2">⚠️ Phí Phạt Pin Lỗi</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-700 ml-4">
                              <li>Mức phạt nhẹ: <strong>{PENALTY_MINOR.toLocaleString("vi-VN")} VNĐ</strong></li>
                              <li>Mức phạt vừa: <strong>{PENALTY_MEDIUM.toLocaleString("vi-VN")} VNĐ</strong></li>
                              <li>Mức phạt nặng: <strong>{PENALTY_SEVERE.toLocaleString("vi-VN")} VNĐ</strong></li>
                            </ul>
                          </div>

                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-3">
                            <h4 className="font-semibold text-blue-800 mb-2">📋 Quy Định Kiểm Tra Pin</h4>
                            <ul className="list-disc list-inside space-y-1 text-blue-700 ml-4">
                              <li>Kiểm tra tình trạng pin sau khi trả</li>
                              <li>Ghi nhận tình trạng pin qua hệ thống</li>
                              <li>Người dùng có quyền từ chối nhận pin có dấu hiệu bất thường</li>
                              <li>Thông báo ngay cho nhân viên nếu phát hiện pin lỗi</li>
                            </ul>
                          </div>
                        </section>

                        {/* 4. Chính sách Thanh toán */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">4. Chính Sách Thanh Toán</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Thanh toán qua ví điện tử, thẻ ngân hàng hoặc chuyển khoản</li>
                            <li>Phí dịch vụ được tính theo gói sử dụng hoặc theo lượt</li>
                            <li>Hoàn tiền trong vòng 7-14 ngày làm việc nếu hủy dịch vụ hợp lệ</li>
                            <li>Không hoàn phí nếu đã sử dụng dịch vụ thay pin</li>
                          </ul>
                        </section>

                        {/* 5. Chính sách Bảo mật */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">5. Chính Sách Bảo Mật</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo quy định pháp luật.
                            Thông tin sẽ chỉ được sử dụng cho mục đích cung cấp dịch vụ và không chia sẻ
                            cho bên thứ ba mà không có sự đồng ý của bạn.
                          </p>
                        </section>

                        {/* 6. Trách nhiệm và Giới hạn */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">6. Trách Nhiệm và Giới Hạn</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Hệ thống không chịu trách nhiệm về các sự cố do lỗi người dùng</li>
                            <li>Không đảm bảo pin luôn sẵn sàng 100% tại mọi trạm vào mọi thời điểm</li>
                            <li>Có quyền từ chối dịch vụ nếu phát hiện vi phạm điều khoản</li>
                            <li>Không chịu trách nhiệm về thiệt hại gián tiếp hoặc mất mát dữ liệu</li>
                          </ul>
                        </section>

                        {/* 7. Điều khoản Chung */}
                        <section className="space-y-2">
                          <h3 className="font-bold text-lg text-electric-blue">7. Điều Khoản Chung</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Chúng tôi có quyền thay đổi điều khoản bất kỳ lúc nào</li>
                            <li>Tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận điều khoản mới</li>
                            <li>Mọi tranh chấp sẽ được giải quyết theo pháp luật Việt Nam</li>
                          </ul>
                        </section>

                        {/* Contact */}
                        <section className="bg-slate-100 p-4 rounded-lg">
                          <h3 className="font-bold text-lg mb-2">📞 Liên Hệ Hỗ Trợ</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Email: <strong className="text-electric-blue">support@evbatteryswap.vn</strong></p>
                            <p>Giờ làm việc: 24/7</p>
                          </div>
                        </section>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bạn cần đọc và chấp nhận điều khoản để tiếp tục
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-electric-blue hover:bg-electric-blue-dark"
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>
          <br />
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-electric-blue hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:underline block">
              ← Quay về trang chủ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;