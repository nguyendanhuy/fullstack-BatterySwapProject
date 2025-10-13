import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { verifyEmailAPI, resendEmailAPIbyToken } from "@/services/axios.services";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null
    const [errorMessage, setErrorMessage] = useState(''); // Lưu message lỗi
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            handleVerifyEmail(token);
        } else {
            setVerificationStatus('error');
            toast({
                title: "Thiếu token",
                description: "Không tìm thấy token xác thực trong URL",
                variant: "destructive"
            });
        }
    }, [token]);

    const handleVerifyEmail = async (token) => {
        setIsLoading(true);
        try {
            const response = await verifyEmailAPI(token);
            console.log("Verify email response:", response);

            if (response.success) {
                setVerificationStatus('success');
                toast({
                    title: "Xác thực thành công!",
                    description: response?.message || "Email của bạn đã được xác thực thành công. Bạn sẽ được chuyển về trang đăng nhập.",
                    className: 'bg-green-500 text-white',
                });

                setTimeout(() => {
                    navigate("/login");
                }, 5000);
            } else {
                setVerificationStatus('error');
                setErrorMessage(response?.message || "Có lỗi xảy ra khi xác thực email"); // Lưu message lỗi
                toast({
                    title: "Xác thực thất bại",
                    description: response?.message || "Có lỗi xảy ra khi xác thực email",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Verify email error:", error);
            setVerificationStatus('error');
            const errorMsg = error.response?.message || "Có lỗi xảy ra khi xác thực email";
            setErrorMessage(errorMsg); // Lưu message lỗi
            toast({
                title: "Xác thực thất bại",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }; const handleBackToLogin = () => {
        navigate("/login");
    };

    const handleResendEmail = async () => {
        if (!token) {
            toast({
                title: "Không thể gửi lại",
                description: "Không tìm thấy token để gửi lại email xác thực",
                variant: "destructive"
            });
            return;
        }

        setIsResending(true);
        try {
            const response = await resendEmailAPIbyToken(token);
            console.log("Resend email response:", response);

            if (response.success) {
                toast({
                    title: "Gửi lại thành công!",
                    description: (
                        <div className="space-y-3">
                            <p>Vui lòng kiểm tra email, hộp thư spam để xác thực lại tài khoản</p>
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
            } else {
                toast({
                    title: "Gửi lại thất bại",
                    description: response?.message || "Có lỗi xảy ra khi gửi lại email xác thực",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Resend email error:", error);
            toast({
                title: "Gửi lại thất bại",
                description: error.response?.data?.message || "Có lỗi xảy ra khi gửi lại email xác thực",
                variant: "destructive"
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {isLoading ? (
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                        ) : verificationStatus === 'success' ? (
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        ) : verificationStatus === 'error' ? (
                            <XCircle className="h-16 w-16 text-red-500" />
                        ) : (
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {isLoading ? "Đang xác thực..." :
                            verificationStatus === 'success' ? "Xác thực thành công!" :
                                verificationStatus === 'error' ? "Xác thực thất bại" :
                                    "Đang xử lý..."}
                    </CardTitle>
                    <CardDescription>
                        {isLoading ? "Vui lòng đợi trong giây lát..." :
                            verificationStatus === 'success' ? "Email của bạn đã được xác thực thành công. Bạn sẽ được chuyển về trang đăng nhập." :
                                verificationStatus === 'error' ? "Có lỗi xảy ra trong quá trình xác thực email." :
                                    "Đang xử lý yêu cầu xác thực email..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Button
                            onClick={handleBackToLogin}
                            className="w-full"
                            disabled={isLoading || isResending}
                        >
                            {verificationStatus === 'success' ? "Đăng nhập ngay" : "Quay lại đăng nhập"}
                        </Button>

                        {verificationStatus === 'error' && token && errorMessage === "Liên kết xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác minh." && (
                            <Button
                                onClick={handleResendEmail}
                                variant="outline"
                                className="w-full"
                                disabled={isLoading || isResending}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang gửi lại...
                                    </>
                                ) : (
                                    "📧 Gửi lại email xác thực"
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;