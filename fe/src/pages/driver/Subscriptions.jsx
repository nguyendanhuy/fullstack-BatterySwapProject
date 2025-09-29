import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Battery, Check, Crown, Star, Zap, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
const Subscriptions = () => {
    const packages = [
        {
            id: "basic",
            name: "Gói Cơ bản",
            price: "299,000",
            period: "tháng",
            description: "Phù hợp cho việc sử dụng hàng ngày",
            features: [
                "10 lần đổi pin/tháng",
                "Ưu tiên đặt lịch",
                "Hỗ trợ 24/7",
                "Không phí phụ thu",
                "Thông báo trạng thái pin"
            ],
            popular: false,
            icon: Battery,
            color: "from-blue-500 to-indigo-500",
            bgColor: "from-blue-50 to-indigo-50"
        },
        {
            id: "premium",
            name: "Gói Premium",
            price: "499,000",
            period: "tháng",
            description: "Lựa chọn tốt nhất cho người dùng thường xuyên",
            features: [
                "20 lần đổi pin/tháng",
                "Ưu tiên cao đặt lịch",
                "Hỗ trợ VIP 24/7",
                "Miễn phí tại mọi trạm",
                "Bảo trì pin miễn phí",
                "Báo cáo chi tiết hàng tháng"
            ],
            popular: true,
            icon: Star,
            color: "from-green-500 to-emerald-500",
            bgColor: "from-green-50 to-emerald-50"
        },
        {
            id: "unlimited",
            name: "Gói Không giới hạn",
            price: "899,000",
            period: "tháng",
            description: "Dành cho doanh nghiệp và sử dụng cao",
            features: [
                "Không giới hạn lần đổi pin",
                "Ưu tiên tuyệt đối",
                "Quản lý tài khoản riêng",
                "Báo cáo chi tiết",
                "Hỗ trợ kỹ thuật chuyên biệt",
                "API tích hợp"
            ],
            popular: false,
            icon: Crown,
            color: "from-purple-500 to-pink-500",
            bgColor: "from-purple-50 to-pink-50"
        }
    ];
    const currentSubscription = {
        package: "premium",
        expiryDate: "15/01/2025",
        remainingSwaps: 15
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-20 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Battery className="h-10 w-10 text-white"/>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Gói thuê pin thông minh</h1>
                <p className="text-white/90 text-lg">Chọn gói phù hợp với nhu cầu sử dụng của bạn</p>
              </div>
            </div>
            <Link to="/driver">
              <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                <ArrowLeft className="h-5 w-5 mr-2"/>
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Current Subscription */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-fade-in rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-4">
                <Star className="h-6 w-6 text-white"/>
              </div>
              Gói hiện tại của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/60 rounded-3xl">
                <h3 className="text-3xl font-bold text-green-600 mb-2">Premium</h3>
                <p className="text-gray-600">Đang hoạt động</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Gói phổ biến</Badge>
              </div>
              <div className="text-center p-6 bg-white/60 rounded-3xl">
                <h3 className="text-3xl font-bold text-blue-600 mb-2">{currentSubscription.remainingSwaps}</h3>
                <p className="text-gray-600">Lần đổi còn lại</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="text-center p-6 bg-white/60 rounded-3xl">
                <h3 className="text-3xl font-bold text-purple-600 mb-2">{currentSubscription.expiryDate}</h3>
                <p className="text-gray-600">Ngày hết hạn</p>
                <Button variant="outline" className="mt-2 text-sm">Gia hạn</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Packages */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Chọn gói phù hợp với bạn</h2>
            <p className="text-gray-600 text-lg">Tiết kiệm hơn với các gói thuê bao dài hạn</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => {
            const IconComponent = pkg.icon;
            return (<Card key={pkg.id} className={`relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden group ${pkg.popular ? 'ring-2 ring-green-500 scale-105' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  {pkg.popular && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 text-sm font-semibold">
                        ⭐ Phổ biến nhất
                      </Badge>
                    </div>)}
                  
                  <div className={`h-3 bg-gradient-to-r ${pkg.color}`}></div>
                  
                  <CardHeader className="text-center pb-6">
                    <div className={`mx-auto mb-6 p-4 bg-gradient-to-br ${pkg.bgColor} rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`p-3 bg-gradient-to-r ${pkg.color} rounded-xl`}>
                        <IconComponent className="h-8 w-8 text-white"/>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{pkg.name}</CardTitle>
                    <CardDescription className="text-gray-600 text-base mb-4">{pkg.description}</CardDescription>
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      {pkg.price} VNĐ
                      <span className="text-base text-gray-500 font-normal">/{pkg.period}</span>
                    </div>
                    {pkg.popular && (<div className="flex items-center justify-center text-green-600 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4 mr-1"/>
                        Tiết kiệm 20% so với gói cơ bản
                      </div>)}
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-8">
                    <ul className="space-y-4 mb-8">
                      {pkg.features.map((feature, index) => (<li key={index} className="flex items-center">
                          <div className={`p-1 bg-gradient-to-r ${pkg.color} rounded-full mr-3`}>
                            <Check className="h-3 w-3 text-white"/>
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>))}
                    </ul>
                    
                    <Button className={`w-full h-12 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${pkg.popular
                    ? `bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white`
                    : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'}`} variant={pkg.popular ? "default" : "outline"}>
                      <Zap className="h-5 w-5 mr-2"/>
                      {currentSubscription.package === pkg.id ? "Gia hạn gói" : "Chọn gói này"}
                    </Button>
                    
                    {pkg.popular && (<div className="flex items-center justify-center mt-3 text-sm text-green-600">
                        <Shield className="h-4 w-4 mr-1"/>
                        Đảm bảo hoàn tiền trong 7 ngày
                      </div>)}
                  </CardContent>
                </Card>);
        })}
          </div>
        </div>

        {/* Usage History */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mr-4">
                <Battery className="h-6 w-6 text-white"/>
              </div>
              Lịch sử sử dụng gần đây
            </CardTitle>
            <CardDescription className="text-gray-600">Theo dõi việc sử dụng dịch vụ đổi pin của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
            { station: "Trạm Quận 1", date: "12/12/2024 - 14:30", status: "Đã sử dụng", color: "green" },
            { station: "Trạm Quận 3", date: "10/12/2024 - 09:15", status: "Đã sử dụng", color: "green" },
            { station: "Trạm Bình Thạnh", date: "08/12/2024 - 16:45", status: "Đã sử dụng", color: "green" }
        ].map((usage, index) => (<div key={index} className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-5 w-5 text-white"/>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{usage.station}</p>
                      <p className="text-sm text-gray-600">{usage.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-4 w-4 mr-1"/>
                    {usage.status}
                  </Badge>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Subscriptions;
