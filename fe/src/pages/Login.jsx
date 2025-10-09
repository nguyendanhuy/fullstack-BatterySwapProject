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
import { loginAPI, getInfoByToken } from "../services/axios.services";
import { MouseSparkles } from "@/components/MouseSparkles";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserData } = useContext(SystemContext);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      localStorage.removeItem("token");
    } else return;
  }, []);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
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
      const res = await loginAPI(formData.email.trim(), formData.password);

      console.log("Login response:", res);
      const pickApiMessage = (p) =>
        p?.messages?.auth ||
        p?.messages?.business ||
        p?.error ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại.';

      const httpStatus = typeof res?.status === 'number' ? res.status : undefined;
      const isError =
        !res?.token ||
        (typeof httpStatus === 'number' && httpStatus >= 400) ||
        !!res?.error ||
        !!res?.messages?.auth ||
        !!res?.messages?.business

      if (isError) {
        toast({
          title: 'Đăng nhập thất bại!',
          description: pickApiMessage(res),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng, ${res.email || formData.email}`,
        className: 'bg-green-500 text-white',
      });

      localStorage.setItem('token', res.token);
      setUserData(res);

      const roleRoute = { DRIVER: '/driver', STAFF: '/staff', ADMIN: '/admin' }[res.role] || '/';
      navigate(roleRoute);
    } catch (err) {
      toast({
        title: 'Đăng nhập thất bại!',
        description: err?.message || 'Không thể kết nối máy chủ.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <MouseSparkles />
      <Card className="w-full max-w-md bg-white/95 backdrop-blur border-0">
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
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link to="/signup" className="text-electric-blue hover:underline">
                Đăng ký ngay
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
export default Login;
