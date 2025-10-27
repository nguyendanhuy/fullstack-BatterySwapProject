import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordAPI } from "../services/axios.services";
import { MouseSparkles } from "@/components/MouseSparkles";
import authBackground from "@/assets/auth-background.jpg";

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (!token) {
            toast({
                title: "Lỗi",
                description: "Không tìm thấy token đặt lại mật khẩu. Vui lòng kiểm tra lại email.",
                variant: "destructive",
            });
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        }
    }, [token, navigate, toast]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const pickApiMessage = (res) =>
        res?.messages?.auth ||
        res?.messages?.business ||
        res?.error ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại.';

    const isErrorResponse = (res) =>
        (typeof res?.status === 'number' && res?.status >= 400) ||
        !!res?.error ||
        !!res?.messages?.auth ||
        !!res?.messages?.business;

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        if (!formData.newPassword || !formData.confirmPassword) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập đầy đủ thông tin",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu phải có ít nhất 6 ký tự",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu xác nhận không khớp",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await resetPasswordAPI(token, formData.newPassword, formData.confirmPassword);

            console.log("Reset password response:", res);

            // Check if response has error
            if (isErrorResponse(res)) {
                toast({
                    title: 'Đặt lại mật khẩu thất bại!',
                    description: pickApiMessage(res),
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Đặt lại mật khẩu thành công!',
                description: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.',
                className: 'bg-green-500 text-white',
            });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            console.error("Reset password error:", err);
            toast({
                title: 'Đặt lại mật khẩu thất bại!',
                description: err?.response?.message || err?.message || 'Token không hợp lệ hoặc đã hết hạn.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Don't render form if no token
    if (!token) {
        return (
            <div className="min-h-screen relative flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${authBackground})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-cyan-900/80 backdrop-blur-sm" />
                <MouseSparkles />
                <Card className="relative w-full max-w-md bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Token không hợp lệ</h2>
                            <p className="text-muted-foreground">Đang chuyển hướng về trang đăng nhập...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        <KeyRound className="h-8 w-8 text-electric-blue mr-2" />
                        <span className="text-2xl font-bold text-electric-blue">EV Battery Swap</span>
                    </div>
                    <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
                    <CardDescription>
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                    className="pl-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    className="pl-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-electric-blue hover:bg-electric-blue-dark disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Nhớ mật khẩu?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="text-electric-blue hover:underline"
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
