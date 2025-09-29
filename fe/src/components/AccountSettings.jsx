import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Lock, Eye, EyeOff } from "lucide-react";
const AccountSettings = ({ userRole }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("0912345678");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
    const { toast } = useToast();
    const userInfo = {
        driver: {
            name: "Nguyễn Văn A",
            email: "driver@example.com",
            role: "Tài xế",
            id: "DR001"
        },
        staff: {
            name: "Trần Thị B",
            email: "staff@example.com",
            role: "Nhân viên",
            id: "ST001",
            station: "Trạm Bình Thạnh"
        },
        admin: {
            name: "Lê Văn C",
            email: "admin@example.com",
            role: "Quản trị viên",
            id: "AD001"
        }
    };
    const handlePasswordChange = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng điền đầy đủ thông tin",
                variant: "destructive"
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({
                title: "Mật khẩu không khớp",
                description: "Mật khẩu mới và xác nhận mật khẩu không giống nhau",
                variant: "destructive"
            });
            return;
        }
        if (newPassword.length < 6) {
            toast({
                title: "Mật khẩu quá ngắn",
                description: "Mật khẩu phải có ít nhất 6 ký tự",
                variant: "destructive"
            });
            return;
        }
        toast({
            title: "Cập nhật thành công",
            description: "Mật khẩu đã được thay đổi thành công"
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordDialogOpen(false);
    };
    const handlePhoneChange = () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast({
                title: "Số điện thoại không hợp lệ",
                description: "Vui lòng nhập số điện thoại hợp lệ",
                variant: "destructive"
            });
            return;
        }
        toast({
            title: "Cập nhật thành công",
            description: "Số điện thoại đã được cập nhật"
        });
        setIsPhoneDialogOpen(false);
    };
    const currentUser = userInfo[userRole];
    return (<div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-electric-blue">
            <User className="h-5 w-5 mr-2"/>
            Thông tin tài khoản
          </CardTitle>
          <CardDescription>
            Thông tin cá nhân và vai trò của bạn trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Họ và tên</Label>
              <p className="text-foreground font-medium">{currentUser.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-foreground font-medium">{currentUser.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Vai trò</Label>
              <p className="text-foreground font-medium">{currentUser.role}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Mã ID</Label>
              <p className="text-foreground font-medium">{currentUser.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Số điện thoại</Label>
              <p className="text-foreground font-medium">{phoneNumber}</p>
            </div>
            {userRole === "staff" && "station" in currentUser && (<div>
                <Label className="text-sm font-medium text-muted-foreground">Trạm được gán</Label>
                <p className="text-foreground font-medium">{currentUser.station}</p>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-electric-blue">
            <Lock className="h-5 w-5 mr-2"/>
            Cài đặt bảo mật
          </CardTitle>
          <CardDescription>
            Quản lý mật khẩu và thông tin liên hệ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Mật khẩu</h4>
              <p className="text-sm text-muted-foreground">Thay đổi mật khẩu đăng nhập</p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Đổi mật khẩu</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thay đổi mật khẩu</DialogTitle>
                  <DialogDescription>
                    Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại"/>
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                        {showCurrentPassword ? (<EyeOff className="h-4 w-4"/>) : (<Eye className="h-4 w-4"/>)}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới"/>
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? (<EyeOff className="h-4 w-4"/>) : (<Eye className="h-4 w-4"/>)}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới"/>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handlePasswordChange}>Cập nhật</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Số điện thoại</h4>
              <p className="text-sm text-muted-foreground">Cập nhật số điện thoại liên hệ</p>
            </div>
            <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2"/>
                  Cập nhật
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cập nhật số điện thoại</DialogTitle>
                  <DialogDescription>
                    Nhập số điện thoại mới để cập nhật thông tin liên hệ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại mới</Label>
                    <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Nhập số điện thoại"/>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPhoneDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handlePhoneChange}>Cập nhật</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>);
};
export default AccountSettings;
