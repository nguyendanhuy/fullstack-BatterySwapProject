import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Battery, Eye, EyeOff, User, Mail, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { registerAPI } from "../services/axios.services";
const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    userType: 1,
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
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
    if (!formData.agreeTerms) {
      toast({
        title: "Lỗi",
        description: "Bạn phải đồng ý với điều khoản sử dụng",
        variant: "destructive",
      });
      return;
    }
    const res = await registerAPI(
      formData.fullName,
      formData.email,
      formData.phone,
      formData.address,
      formData.password,
      formData.confirmPassword);
    if (!res.error) {
      toast({
        title: "Đăng ký thành công!",
        description: `User id của bạn là ${res.userId}.`,
      });
      navigate("/login");
    } else {
      toast({
        title: "Đăng ký thất bại!",
        description: res.messages.business,
        variant: "destructive"
      });
    }
  };

  return (<div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
    <Card className="w-full max-w-lg bg-white/95 backdrop-blur border-0">
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

          {/* <div className="space-y-2">
            <Label htmlFor="userType">Loại tài khoản</Label>
            <Select value={formData.userType} onValueChange={(value) => handleInputChange("userType", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại tài khoản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Tài xế</SelectItem>
                <SelectItem value="staff">Nhân viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

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

          <div className="flex items-center space-x-2">
            <Checkbox id="agreeTerms" checked={formData.agreeTerms} onCheckedChange={(checked) => handleInputChange("agreeTerms", checked)} />
            <Label htmlFor="agreeTerms" className="text-sm">
              Tôi đồng ý với{" "}
              <Link to="#" className="text-electric-blue hover:underline">
                điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link to="#" className="text-electric-blue hover:underline">
                chính sách bảo mật
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full bg-electric-blue hover:bg-electric-blue-dark">
            Đăng ký
          </Button>
        </form>

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
  </div>);
};
export default SignUp;
