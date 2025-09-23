import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Zap, Users, BarChart3, LogIn, UserPlus, Star, ArrowRight, CheckCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/ev-station-hero.jpg";
const Landing = () => {
  return <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-primary opacity-90 z-10"></div>
        <img src={heroImage} alt="EV Charging Station" className="w-full h-full object-cover" />
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/25 rounded-full animate-pulse delay-700"></div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center group cursor-pointer">
            <div className="p-2 bg-white/10 rounded-full mr-3 group-hover:bg-white/20 transition-all duration-300">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-white text-2xl block font-bold text-justify">EV Battery Swap</span>
              <span className="text-white/70 text-sm">VINFAST Technology</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" className="text-white border-white/30 bg-white/5 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg backdrop-blur-sm">
                <LogIn className="h-4 w-4 mr-2" />
                Đăng nhập
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-white text-electric-blue hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-xl font-semibold">
                <UserPlus className="h-4 w-4 mr-2" />
                Đăng ký ngay
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-20 container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-24 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 animate-scale-in">
            <Star className="h-4 w-4 mr-2" />
            Công nghệ đổi pin hàng đầu Việt Nam
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Hệ thống
            </span>
            <br />
            <span className="bg-gradient-to-r from-electric-blue-light to-white bg-clip-text text-transparent animate-pulse mt-6 block">
              Đổi Pin EV
            </span>
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl text-white/90 font-bold">
              VINFAST
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-12 leading-relaxed">
            Giải pháp quản lý trạm đổi pin xe điện <span className="font-semibold text-white">hiện đại, nhanh chóng và hiệu quả</span>. 
            Kết nối tài xế, nhân viên và quản trị viên trong một hệ thống thống nhất.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center space-x-8 mb-12 animate-slide-up">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5 phút</div>
              <div className="text-white/70">Đổi pin nhanh</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-white/70">Hoạt động</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100+</div>
              <div className="text-white/70">Trạm đổi pin</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-electric-blue hover:bg-white/90 hover:scale-105 text-xl px-12 py-4 shadow-2xl font-bold transition-all duration-300">
                <Zap className="h-5 w-5 mr-2" />
                Bắt đầu ngay
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:scale-105 text-xl px-12 py-4 backdrop-blur-sm transition-all duration-300">
                <LogIn className="h-5 w-5 mr-2" />
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-28">
          <div className="animate-fade-in delay-100">
            <Card className="group hover:scale-105 transition-all duration-500 border-0 bg-white/90 backdrop-blur-xl shadow-2xl hover:shadow-electric-blue/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg group-hover:shadow-electric-blue/30 transition-all duration-300">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-electric-blue group-hover:text-electric-blue-dark transition-colors">Tài xế</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Đăng ký xe, tìm trạm, đặt lịch đổi pin
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Tìm trạm đổi pin gần nhất</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Đặt lịch trước</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Thanh toán trực tuyến</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Theo dõi lịch sử</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="animate-fade-in delay-300">
            <Card className="group hover:scale-105 transition-all duration-500 border-0 bg-white/90 backdrop-blur-xl shadow-2xl hover:shadow-electric-blue/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg group-hover:shadow-electric-blue/30 transition-all duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-electric-blue group-hover:text-electric-blue-dark transition-colors">Nhân viên</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Quản lý đổi pin, thanh toán, kiểm tra pin
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Quét QR xác nhận</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Kiểm tra pin</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Quản lý kho pin</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Theo dõi giao dịch</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="animate-fade-in delay-500">
            <Card className="group hover:scale-105 transition-all duration-500 border-0 bg-white/90 backdrop-blur-xl shadow-2xl hover:shadow-electric-blue/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg group-hover:shadow-electric-blue/30 transition-all duration-300">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-electric-blue group-hover:text-electric-blue-dark transition-colors">Quản trị</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Báo cáo, thống kê, quản lý hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Dashboard tổng quan</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Báo cáo chi tiết</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Phân tích dữ liệu</li>
                  <li className="flex items-center text-muted-foreground"><CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />Quản lý người dùng</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center animate-scale-in">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Tính năng nổi bật</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">Công nghệ tiên tiến cho hệ sinh thái xe điện</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-20">
            <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:shadow-electric-blue/30 transition-all duration-300">
                <Battery className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Quản lý Pin Thông minh</h3>
              <p className="text-white/80 leading-relaxed">Theo dõi trạng thái pin real-time với công nghệ IoT tiên tiến</p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:shadow-electric-blue/30 transition-all duration-300">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Đổi Pin Nhanh chóng</h3>
              <p className="text-white/80 leading-relaxed">Quy trình đổi pin tối ưu chỉ trong 5 phút với robot tự động</p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:shadow-electric-blue/30 transition-all duration-300">
                <Globe className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Đa vai trò</h3>
              <p className="text-white/80 leading-relaxed">Hệ thống phân quyền thông minh cho tài xế, nhân viên, quản trị</p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:shadow-electric-blue/30 transition-all duration-300">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Báo cáo Chi tiết</h3>
              <p className="text-white/80 leading-relaxed">Thống kê và phân tích dữ liệu toàn diện với AI insights</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-white/20 rounded-full mr-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Sẵn sàng bắt đầu?
                </h3>
              </div>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Tham gia ngay hôm nay và trải nghiệm hệ thống đổi pin xe điện 
                <span className="font-bold text-white"> hiện đại nhất Việt Nam</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-electric-blue hover:bg-white/90 hover:scale-105 text-xl px-12 py-4 shadow-2xl font-bold transition-all duration-300">
                    <Star className="h-5 w-5 mr-2" />
                    Đăng ký miễn phí
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <div className="text-white/70 text-sm">
                  ✨ Không cần thẻ tín dụng • Bắt đầu ngay lập tức
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 bg-white/3 backdrop-blur-xl border-t border-white/5 mt-32">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-2 bg-white/10 rounded-full mr-3">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-white text-xl font-bold">EV Battery Swap System</div>
                <div className="text-white/60 text-sm">Powered by VINFAST Technology</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-6 mb-6 text-white/70">
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Bảo mật cao</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Hỗ trợ 24/7</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Công nghệ AI</span>
            </div>
            <p className="text-white/60 text-sm mb-4">
              © 2024 VINFAST. Hệ thống quản lý trạm đổi pin xe điện hàng đầu Việt Nam.
            </p>
            <p className="text-white/40 text-xs">
              Công nghệ xanh • Tương lai bền vững • Đổi mới không ngừng
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;