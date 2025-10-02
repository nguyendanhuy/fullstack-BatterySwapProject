import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Battery, Zap, Users, BarChart3, LogIn, UserPlus, Star, ArrowRight, CheckCircle, Globe, Phone, Clock, MapPin, Shield, Sparkles, Smartphone, Network, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/electric-scooter-hero.jpg";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
const Landing = () => {
  console.log("Landing component rendering...");
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-electric-blue/80 to-electric-blue-dark/90 z-10 animate-pulse-glow"></div>
          <img src={heroImage} alt="EV Charging Station" className="w-full h-full object-cover animate-scale-in" />
          {/* Animated background elements - nhiều hơn và đẹp hơn */}
          <div className="absolute top-20 left-10 w-3 h-3 bg-white/40 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-4 h-4 bg-electric-blue-light/50 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-electric-blue/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-electric-blue-light/30 rounded-full animate-float" style={{ animationDelay: '0.8s' }}></div>

          {/* Floating Icons - Animated continuously */}
          <div className="absolute top-32 left-1/4 animate-float opacity-20">
            <Battery className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="absolute top-1/3 right-1/3 animate-float opacity-20" style={{ animationDelay: '1.2s' }}>
            <Zap className="h-10 w-10 text-electric-blue-light animate-pulse" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-float opacity-20" style={{ animationDelay: '2.5s' }}>
            <Sparkles className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-float opacity-20" style={{ animationDelay: '1.8s' }}>
            <Battery className="h-6 w-6 text-electric-blue-light animate-pulse" />
          </div>

          {/* Thêm gradient circles lớn */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

          {/* Animated lines moving across */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-in-right"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-electric-blue-light/30 to-transparent animate-slide-in-right" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-20 bg-white/10 backdrop-blur-md animate-slide-in-right">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-full mr-3">
                  <Battery className="h-8 w-8 text-white" />
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
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="font-semibold">0369.123.456</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                    <LogIn className="h-4 w-4 mr-2" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    <UserPlus className="h-4 w-4 mr-2" />
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
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 animate-fade-in hover-scale">
              <Star className="h-4 w-4 mr-2 animate-pulse" />
              EV Battery Swap
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
              Hãy để chúng tôi làm sạch
              <span className="block text-electric-blue-light animate-pulse-glow">những tấm pin giúp bạn nào.</span>
            </h1>

            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Dịch vụ đổi pin xe điện chuyên nghiệp, nhanh chóng và hiệu quả.
              Kết nối tài xế, nhân viên và quản trị viên trong một hệ thống thống nhất.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 hover-scale hover-glow text-lg px-8 py-4 rounded-full shadow-xl group">
                  ĐẶT DỊCH VỤ
                  <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
            <div className="relative animate-fade-in">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-electric-blue/10 rounded-full animate-float"></div>
              <div className="absolute top-8 left-8 w-16 h-16 bg-electric-blue/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
              <div className="relative bg-electric-blue-light/30 rounded-3xl p-8 text-center hover-lift transition-all duration-300">
                {/* Rotating ring around icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-electric-blue/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border-2 border-electric-blue/20 rounded-full animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}></div>

                <div className="bg-electric-blue rounded-2xl p-6 w-fit mx-auto mb-6 hover-scale relative z-10">
                  <Users className="h-16 w-16 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-electric-blue mb-2">Chào mừng bạn đến!</h3>
              </div>
            </div>

            <div className="animate-slide-up">
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
                <Button className="bg-electric-blue text-white hover:bg-electric-blue-dark px-8 py-3 rounded-full hover-scale hover-glow group">
                  KHU THƯƠNG MẠI
                  <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full hover-scale group">
                  KHU DÂN CƯ
                  <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden" id="services">
        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-electric-blue/5 rounded-full animate-float"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-primary/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>

        {/* Continuous moving icons */}
        <div className="absolute top-1/4 left-10 animate-float opacity-10">
          <Zap className="h-12 w-12 text-electric-blue" />
        </div>
        <div className="absolute bottom-1/3 right-20 animate-float opacity-10" style={{ animationDelay: '1.5s' }}>
          <Battery className="h-14 w-14 text-primary" />
        </div>
        <div className="absolute top-2/3 left-1/4 animate-float opacity-10" style={{ animationDelay: '2.5s' }}>
          <Sparkles className="h-10 w-10 text-electric-blue" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="text-primary text-lg font-medium mb-4 italic">Những dịch vụ của chúng tôi</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Hãy đưa chúng tôi pin của bạn.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-lg overflow-hidden animate-fade-in card-hover">
              <div className="aspect-square bg-gradient-to-br from-electric-blue to-electric-blue-dark p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                <Battery className="h-16 w-16 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-electric-blue transition-colors">Kiểm tra Pin</h3>
                <p className="text-gray-600">Kiểm tra tình trạng pin chi tiết với công nghệ AI</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-lg overflow-hidden animate-fade-in card-hover" style={{ animationDelay: '0.1s' }}>
              <div className="aspect-square bg-gradient-to-br from-primary to-electric-blue-dark p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                <Zap className="h-16 w-16 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-primary transition-colors">Đổi Pin Nhanh</h3>
                <p className="text-gray-600">Quy trình đổi pin tự động chỉ trong 5 phút</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-lg overflow-hidden animate-fade-in card-hover" style={{ animationDelay: '0.2s' }}>
              <div className="aspect-square bg-gradient-to-br from-primary to-electric-blue-dark p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                <Shield className="h-16 w-16 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-primary transition-colors">Bảo vệ</h3>
                <p className="text-gray-600">Bảo vệ pin khỏi hư hỏng và kéo dài tuổi thọ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--electric-blue)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="text-primary text-lg font-medium mb-4 italic">Tính năng nổi bật</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Trải nghiệm dịch vụ của chúng tôi
            </h2>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <Zap className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">Quy trình nhanh</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Đổi pin tự động chỉ trong 5 phút với công nghệ tiên tiến</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-primary to-electric-blue-dark p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <Smartphone className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">Ứng dụng di động</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Đặt lịch và thanh toán dễ dàng qua ứng dụng thông minh</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-electric-blue-light to-primary p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <Network className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">Mạng lưới rộng</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Hơn 100 trạm đổi pin trên toàn quốc</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-primary to-electric-blue p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <HeadphonesIcon className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">Hỗ trợ 24/7</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Đội ngũ hỗ trợ sẵn sàng phục vụ mọi lúc mọi nơi</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-electric-blue-dark to-primary p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <Shield className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">An toàn tuyệt đối</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Kiểm tra chất lượng pin nghiêm ngặt và bảo hành toàn diện</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-xl overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-primary to-electric-blue-light p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                      <Battery className="h-20 w-20 text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <h3 className="text-2xl font-bold text-white text-center relative z-10">Pin chất lượng cao</h3>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 text-center">Pin VINFAST chính hãng với hiệu suất vượt trội</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-electric-blue via-primary to-electric-blue-dark relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div className="group hover-scale animate-fade-in">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform animate-pulse-glow">5 phút</div>
              <div className="text-white/80 group-hover:text-white transition-colors">Thời gian đổi pin</div>
            </div>
            <div className="group hover-scale animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform animate-pulse-glow">24/7</div>
              <div className="text-white/80 group-hover:text-white transition-colors">Hoạt động liên tục</div>
            </div>
            <div className="group hover-scale animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform animate-pulse-glow">100+</div>
              <div className="text-white/80 group-hover:text-white transition-colors">Trạm đổi pin</div>
            </div>
            <div className="group hover-scale animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform animate-pulse-glow">99.9%</div>
              <div className="text-white/80 group-hover:text-white transition-colors">Độ tin cậy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Animated decorations */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-electric-blue/5 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-20 w-32 h-32 bg-primary/5 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>

        {/* Floating particles continuously */}
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-electric-blue/30 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-electric-blue/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>

        {/* Rotating elements in background */}
        <div className="absolute top-1/4 right-10 w-24 h-24 border-2 border-electric-blue/10 rounded-full animate-spin" style={{ animationDuration: '15s' }}></div>
        <div className="absolute bottom-1/4 left-10 w-32 h-32 border-2 border-primary/10 rounded-full animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Dành cho mọi đối tượng</h2>
            <p className="text-xl text-gray-600">Hệ thống phân quyền thông minh</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-xl relative overflow-hidden card-hover animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg hover-scale glow-primary">
                  <Zap className="h-10 w-10 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Tài xế</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Đăng ký xe, tìm trạm, đặt lịch đổi pin
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Tìm trạm đổi pin gần nhất
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Đặt lịch trước
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Thanh toán trực tuyến
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Theo dõi lịch sử
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-xl relative overflow-hidden card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg hover-scale glow-primary">
                  <Users className="h-10 w-10 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Nhân viên</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Quản lý đổi pin, thanh toán, kiểm tra pin
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Quét QR xác nhận
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Kiểm tra pin
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Quản lý kho pin
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Theo dõi giao dịch
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 hover-lift transition-all duration-500 border-0 shadow-xl relative overflow-hidden card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-2xl w-fit shadow-lg hover-scale glow-primary">
                  <BarChart3 className="h-10 w-10 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-electric-blue">Quản trị</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Báo cáo, thống kê, quản lý hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Dashboard tổng quan
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Báo cáo chi tiết
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Phân tích dữ liệu
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-3 text-electric-blue" />
                    Quản lý người dùng
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-electric-blue/5 relative overflow-hidden" id="contact">
        {/* Animated background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-electric-blue rounded-full mr-4 hover-scale animate-pulse-glow">
                <Star className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h3 className="text-4xl font-bold text-gray-800 animate-slide-up">
                Sẵn sàng bắt đầu?
              </h3>
            </div>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Tham gia ngay hôm nay và trải nghiệm hệ thống đổi pin xe điện
              <span className="font-bold text-electric-blue animate-pulse-glow"> hiện đại nhất Việt Nam</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-12 py-4 rounded-full shadow-xl hover-scale hover-glow group">
                  <Star className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Đăng ký miễn phí
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
    </div>
  );
};

export default Landing;