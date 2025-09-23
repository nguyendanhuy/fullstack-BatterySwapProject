import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Zap, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <Battery className="h-12 w-12 text-white mr-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              EV Battery Swap
            </h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Hệ thống quản lý trạm đổi pin xe điện VINFAST hiện đại và hiệu quả
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slide-up">
          {/* Driver Card */}
          <Card className="hover-scale hover-glow border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-electric-blue-light rounded-full w-fit">
                <Zap className="h-8 w-8 text-electric-blue" />
              </div>
              <CardTitle className="text-2xl text-electric-blue">Tài xế</CardTitle>
              <CardDescription className="text-base">
                Đăng ký xe, tìm trạm, đặt lịch đổi pin
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/driver">
                <Button className="w-full bg-electric-blue hover:bg-electric-blue-dark">
                  Truy cập Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Staff Card */}
          <Card className="hover-scale hover-glow border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-electric-blue-light rounded-full w-fit">
                <Users className="h-8 w-8 text-electric-blue" />
              </div>
              <CardTitle className="text-2xl text-electric-blue">Nhân viên</CardTitle>
              <CardDescription className="text-base">
                Quản lý đổi pin, thanh toán, kiểm tra pin
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/staff">
                <Button className="w-full bg-electric-blue hover:bg-electric-blue-dark">
                  Truy cập Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover-scale hover-glow border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-electric-blue-light rounded-full w-fit">
                <BarChart3 className="h-8 w-8 text-electric-blue" />
              </div>
              <CardTitle className="text-2xl text-electric-blue">Quản trị</CardTitle>
              <CardDescription className="text-base">
                Báo cáo, thống kê, quản lý hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/admin">
                <Button className="w-full bg-electric-blue hover:bg-electric-blue-dark">
                  Truy cập Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center animate-scale-in">
          <h2 className="text-3xl font-bold text-white mb-8">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-white">
              <Battery className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Quản lý Pin Thông minh</h3>
              <p className="text-sm text-white/80">Theo dõi trạng thái pin real-time</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-white">
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Đổi Pin Nhanh chóng</h3>
              <p className="text-sm text-white/80">Quy trình đổi pin tối ưu</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-white">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Đa vai trò</h3>
              <p className="text-sm text-white/80">Tài xế, nhân viên, quản trị</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-white">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Báo cáo Chi tiết</h3>
              <p className="text-sm text-white/80">Thống kê và phân tích dữ liệu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;