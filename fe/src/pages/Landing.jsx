import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Zap, Users, BarChart3, LogIn, UserPlus, Star, ArrowRight, CheckCircle, Phone, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/electric-scooter-hero.jpg";
const Landing = () => {
    console.log("Landing component rendering...");
    return (<div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-electric-blue-dark/90 z-10"></div>
          <img src={heroImage} alt="EV Charging Station" className="w-full h-full object-cover"/>
          {/* Animated background elements */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-20 bg-white/10 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-full mr-3">
                  <Battery className="h-8 w-8 text-white"/>
                </div>
                <div>
                  <div className="text-white text-xl font-bold">EV Battery Swap</div>
                  <div className="text-white/70 text-sm">VINFAST Technology</div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-8 text-white">
                <a href="#services" className="hover:text-white/80 transition-colors">DỊCH VỤ</a>
                <a href="#about" className="hover:text-white/80 transition-colors">GIỚI THIỆU</a>
                <a href="#contact" className="hover:text-white/80 transition-colors">LIÊN HỆ</a>
                <div className="flex items-center text-white/90">
                  <Phone className="h-4 w-4 mr-2"/>
                  <span className="font-semibold">0369.123.456</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                    <LogIn className="h-4 w-4 mr-2"/>
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    <UserPlus className="h-4 w-4 mr-2"/>
                    Đăng ký
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8">
              <Star className="h-4 w-4 mr-2"/>
              EV Battery Swap
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Hãy để chúng tôi làm sạch 
              <span className="block text-electric-blue-light">những tấm pin giúp bạn nào.</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Dịch vụ đổi pin xe điện chuyên nghiệp, nhanh chóng và hiệu quả. 
              Kết nối tài xế, nhân viên và quản trị viên trong một hệ thống thống nhất.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-4 rounded-full shadow-xl">
                  ĐẶT DỊCH VỤ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V50Q600,120,1200,50V0Z" className="fill-white"></path>
          </svg>
        </div>
      </div>

      {/* Welcome Section */}
      <section className="py-20 bg-white" id="about">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-electric-blue/10 rounded-full"></div>
              <div className="absolute top-8 left-8 w-16 h-16 bg-electric-blue/20 rounded-full"></div>
              <div className="relative bg-electric-blue-light/30 rounded-3xl p-8 text-center">
                <div className="bg-electric-blue rounded-2xl p-6 w-fit mx-auto mb-6">
                  <Users className="h-16 w-16 text-white"/>
                </div>
                <h3 className="text-2xl font-bold text-electric-blue mb-2">Chào mừng bạn đến!</h3>
              </div>
            </div>
            
            <div>
              <div className="text-primary text-lg font-medium mb-4 italic">Chào mừng bạn đến!</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                Dịch vụ đổi pin xe điện chuyên nghiệp của chúng tôi
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Như bạn biết các sản phẩm sạc pin thông thường có thể giúp ích, nhưng không thể so sánh được với 
                sức mạnh của dịch vụ đổi pin chuyên nghiệp của chúng tôi. EVSwap có thể giúp loại bỏ mọi vấn đề 
                về pin trong cuộc sống hàng ngày.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-electric-blue text-white hover:bg-electric-blue-dark px-8 py-3 rounded-full">
                  KHU THƯƠNG MẠI
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full">
                  KHU DÂN CƯ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-primary text-lg font-medium mb-4 italic">Những dịch vụ của chúng tôi</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Hãy đưa chúng tôi pin của bạn.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-electric-blue to-electric-blue-dark p-8 flex items-center justify-center">
                <Battery className="h-16 w-16 text-white"/>
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Kiểm tra Pin</h3>
                <p className="text-gray-600">Kiểm tra tình trạng pin chi tiết với công nghệ AI</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-primary to-electric-blue-dark p-8 flex items-center justify-center">
                <Zap className="h-16 w-16 text-white"/>
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Đổi Pin Nhanh</h3>
                <p className="text-gray-600">Quy trình đổi pin tự động chỉ trong 5 phút</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-primary to-electric-blue-dark p-8 flex items-center justify-center">
                <Shield className="h-16 w-16 text-white"/>
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Bảo vệ</h3>
                <p className="text-gray-600">Bảo vệ pin khỏi hư hỏng và kéo dài tuổi thọ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-electric-blue">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">5 phút</div>
              <div className="text-white/80">Thời gian đổi pin</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Hoạt động liên tục</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-white/80">Trạm đổi pin</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-white/80">Độ tin cậy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Dành cho mọi đối tượng</h2>
            <p className="text-xl text-gray-600">Hệ thống phân quyền thông minh</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg">
                  <Zap className="h-10 w-10 text-white"/>
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Tài xế</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Đăng ký xe, tìm trạm, đặt lịch đổi pin
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Tìm trạm đổi pin gần nhất
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Đặt lịch trước
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Thanh toán trực tuyến
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Theo dõi lịch sử
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg">
                  <Users className="h-10 w-10 text-white"/>
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Nhân viên</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Quản lý đổi pin, thanh toán, kiểm tra pin
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Quét QR xác nhận
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Kiểm tra pin
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Quản lý kho pin
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Theo dõi giao dịch
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg">
                  <BarChart3 className="h-10 w-10 text-white"/>
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Quản trị</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Báo cáo, thống kê, quản lý hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Dashboard tổng quan
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Báo cáo chi tiết
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Phân tích dữ liệu
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue"/>
                    Quản lý người dùng
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50" id="contact">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-electric-blue rounded-full mr-4">
                <Star className="h-8 w-8 text-white"/>
              </div>
              <h3 className="text-4xl font-bold text-gray-800">
                Sẵn sàng bắt đầu?
              </h3>
            </div>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Tham gia ngay hôm nay và trải nghiệm hệ thống đổi pin xe điện 
              <span className="font-bold text-electric-blue"> hiện đại nhất Việt Nam</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-12 py-4 rounded-full shadow-xl">
                  <Star className="h-5 w-5 mr-2"/>
                  Đăng ký miễn phí
                  <ArrowRight className="h-5 w-5 ml-2"/>
                </Button>
              </Link>
              <div className="text-gray-500 text-sm">
                ✨ Không cần thẻ tín dụng • Bắt đầu ngay lập tức
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-2 bg-electric-blue rounded-full mr-3">
                <Battery className="h-8 w-8 text-white"/>
              </div>
              <div>
                <div className="text-white text-xl font-bold">EV Battery Swap System</div>
                <div className="text-white/60 text-sm">Powered by VINFAST Technology</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-6 mb-6 text-white/70">
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Bảo mật cao</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Hỗ trợ 24/7</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Công nghệ AI</span>
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
     </div>);
};
export default Landing;
