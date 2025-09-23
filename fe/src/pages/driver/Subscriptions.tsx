import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Battery, Check, Crown, Star } from "lucide-react";
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
        "Không phí phụ thu"
      ],
      popular: false,
      icon: Battery
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
        "Bảo trì pin miễn phí"
      ],
      popular: true,
      icon: Star
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
        "Hỗ trợ kỹ thuật chuyên biệt"
      ],
      popular: false,
      icon: Crown
    }
  ];

  const currentSubscription = {
    package: "premium",
    expiryDate: "15/01/2025",
    remainingSwaps: 15
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Battery className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Gói thuê pin</h1>
          </div>
          <Link to="/driver">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Current Subscription */}
        <Card className="mb-8 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-6 w-6 mr-2 text-electric-blue" />
              Gói hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-electric-blue">Premium</h3>
                <p className="text-muted-foreground">Đang hoạt động</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{currentSubscription.remainingSwaps}</h3>
                <p className="text-muted-foreground">Lần đổi còn lại</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{currentSubscription.expiryDate}</h3>
                <p className="text-muted-foreground">Hết hạn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Packages */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8">Chọn gói phù hợp</h2>
          <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
            {packages.map((pkg) => {
              const IconComponent = pkg.icon;
              return (
                <Card key={pkg.id} className={`relative hover-glow ${pkg.popular ? 'ring-2 ring-electric-blue' : ''}`}>
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-electric-blue">
                      Phổ biến nhất
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-electric-blue-light rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-electric-blue" />
                    </div>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="text-3xl font-bold text-electric-blue">
                      {pkg.price} VNĐ
                      <span className="text-sm text-muted-foreground font-normal">/{pkg.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${pkg.popular ? 'bg-electric-blue hover:bg-electric-blue-dark' : ''}`}
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      {currentSubscription.package === pkg.id ? "Gia hạn" : "Chọn gói"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Usage History */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Lịch sử sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Trạm Quận 1</p>
                  <p className="text-sm text-muted-foreground">12/12/2024 - 14:30</p>
                </div>
                <Badge variant="secondary">Đã sử dụng</Badge>
              </div>
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Trạm Quận 3</p>
                  <p className="text-sm text-muted-foreground">10/12/2024 - 09:15</p>
                </div>
                <Badge variant="secondary">Đã sử dụng</Badge>
              </div>
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Trạm Bình Thạnh</p>
                  <p className="text-sm text-muted-foreground">08/12/2024 - 16:45</p>
                </div>
                <Badge variant="secondary">Đã sử dụng</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscriptions;