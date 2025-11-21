import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { SystemContext } from "../contexts/system.context";
import { loginAPI, loginByGoogleAPI, forgotPasswordAPI } from "../services/axios.services";
import { MouseSparkles } from "@/components/MouseSparkles";
import authBackground from "@/assets/auth-background.jpg";
import { GoogleLogin } from '@react-oauth/google';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";




const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserData } = useContext(SystemContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) localStorage.removeItem("token");
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helpers
  const pickApiMessage = (res) => res?.message || res?.messages?.auth || res?.messages?.business || res?.error || "Có lỗi xảy ra.";
  const isErrorResponse = (res) => res?.success === false || !!(res?.error || res?.messages?.auth || res?.messages?.business || res?.status === 'error');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;  // chặn việc spam nút đăng nhập
    if (!formData.email || !formData.password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email và mật khẩu",
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

    setLoading(true);
    try {
      const res = await loginAPI(formData.email.trim(), formData.password.trim());

      console.log("✅Login response:", res);

      if (isErrorResponse(res)) {
        toast({
          title: 'Đăng nhập thất bại!',
          description: pickApiMessage(res),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng, ${res.fullName || res.email || formData.email}`,
        className: 'bg-green-500 text-white',
      });

      localStorage.setItem('token', res.token);
      setUserData(res);

      const roleRoute = { DRIVER: '/driver', STAFF: '/staff', ADMIN: '/admin' }[res.role] || '/';
      navigate(roleRoute);
    } catch (err) {
      toast({
        title: 'Đăng nhập thất bại!',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      console.log('Google credential:', credentialResponse);

      setLoading(true);
      const res = await loginByGoogleAPI({
        token: credentialResponse.credential
      });
      console.log("✅Google login response:", res);

      if (isErrorResponse(res)) {
        toast({
          title: 'Đăng nhập thất bại!',
          description: pickApiMessage(res),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng, ${res.fullName || formData.email}`,
        className: 'bg-green-500 text-white',
      });

      localStorage.setItem('token', res.token);
      setUserData(res);

      const roleRoute = { DRIVER: '/driver', STAFF: '/staff', ADMIN: '/admin' }[res.role] || '/';
      navigate(roleRoute);
    } catch (err) {
      toast({
        title: 'Đăng nhập Google thất bại!',
        description: err?.message || 'Không thể xác thực với Google',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!forgotPasswordEmail) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập email",
          variant: "destructive",
        });
        return;
      }

      const res = await forgotPasswordAPI(forgotPasswordEmail.trim());
      console.log("✅Forgot password response:", res);

      if (isErrorResponse(res)) {
        toast({
          title: 'Yêu cầu thất bại!',
          description: pickApiMessage(res),
          variant: 'destructive',
        });
        return;
      }

      setForgotPasswordDialogOpen(false);
      setForgotPasswordEmail("");

      toast({
        title: 'Yêu cầu thành công!',
        description: (
          <div className="space-y-3">
            <p>Vui lòng kiểm tra email, hộp thư spam để đặt lại mật khẩu</p>
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
    } catch (err) {
      toast({
        title: 'Yêu cầu thất bại!',
        description: err?.message || 'Không thể kết nối máy chủ.',
        variant: 'destructive',
      });
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
      <Card className="relative w-full max-w-md bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-electric-blue mr-2" />
            <span className="text-2xl font-bold text-electric-blue">EV Battery Swap</span>
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Đăng nhập để sử dụng hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-electric-blue hover:bg-electric-blue-dark disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast({
                    title: 'Đăng nhập thất bại',
                    description: 'Không thể đăng nhập với Google',
                    variant: 'destructive',
                  });
                }}
                useOneTap
              />
            </div>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link to="/signup" className="text-electric-blue hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Quên mật khẩu?{" "}
              <Dialog open={forgotPasswordDialogOpen} onOpenChange={setForgotPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-electric-blue hover:underline">Đặt lại</button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đặt lại mật khẩu</DialogTitle>
                    <DialogDescription>
                      Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your@email.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={handleForgotPassword}
                      className="bg-electric-blue hover:bg-electric-blue-dark"
                    >
                      Gửi liên kết
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
export default Login;
