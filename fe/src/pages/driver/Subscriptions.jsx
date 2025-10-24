import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Battery, Check, Crown, Star, Zap, Shield, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAllPlans, getDriverSubscription } from "../../services/axios.services";
import { toast } from "sonner";
import { useEffect, useState, useContext } from "react";
import { SystemContext } from "../../contexts/system.context";

const Subscriptions = () => {
  const { userData } = useContext(SystemContext);
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansResponse = await getAllPlans();
        console.log("Plans response:", plansResponse);

        if (plansResponse && plansResponse.success && plansResponse.plans) {
          // Map API data to UI format
          const mappedPackages = plansResponse.plans.map(plan => {
            let icon, color, bgColor;

            // Map based on planName
            switch (plan.planName) {
              case "BASIC":
                icon = Battery;
                color = "from-blue-500 to-indigo-500";
                bgColor = "from-blue-50 to-indigo-50";
                break;
              case "PREMIUM":
                icon = Star;
                color = "from-green-500 to-emerald-500";
                bgColor = "from-green-50 to-emerald-50";
                break;
              case "UNLIMITED":
                icon = Crown;
                color = "from-purple-500 to-pink-500";
                bgColor = "from-purple-50 to-pink-50";
                break;
              default:
                icon = Battery;
                color = "from-gray-500 to-slate-500";
                bgColor = "from-gray-50 to-slate-50";
            }

            // Split description into feature list
            const features = plan.description
              .split('. ')
              .filter(item => item.trim().length > 0)
              .map(item => item.trim().endsWith('.') ? item.trim() : item.trim() + '.');

            return {
              id: plan.planId,
              name: plan.planName === "BASIC" ? "Gói Cơ bản"
                : plan.planName === "PREMIUM" ? "Gói Premium"
                  : "Gói Không giới hạn",
              price: plan.price.toLocaleString('vi-VN'),
              period: "tháng",
              description: plan.description,
              features: features,
              popular: plan.planName === "PREMIUM",
              icon: icon,
              color: color,
              bgColor: bgColor,
              planName: plan.planName,
              swapLimit: plan.swapLimit,
              priceType: plan.priceType
            };
          });

          setPackages(mappedPackages);
        }
        console.log("User data:", userData);

        // Fetch current subscription
        if (userData && userData.userId) {
          const subscriptionResponse = await getDriverSubscription(userData.userId);
          console.log("Subscription response:", subscriptionResponse);

          if (subscriptionResponse && subscriptionResponse.success && subscriptionResponse.subscription) {
            setCurrentSubscription(subscriptionResponse.subscription);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách gói...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gói thuê pin</h1>
        </div>
      </header>
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Current Subscription */}
        {currentSubscription ? (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-fade-in rounded-3xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                Gói hiện tại của bạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/60 rounded-3xl">
                  <h3 className="text-3xl font-bold text-green-600 mb-2">
                    {currentSubscription.plan.planName === "BASIC" ? "Cơ bản"
                      : currentSubscription.plan.planName === "PREMIUM" ? "Premium"
                        : "Không giới hạn"}
                  </h3>
                  <p className="text-gray-600">Đang hoạt động</p>
                  {currentSubscription.plan.planName === "PREMIUM" && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Gói phổ biến</Badge>
                  )}
                </div>
                <div className="text-center p-6 bg-white/60 rounded-3xl">
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">
                    {currentSubscription.plan.swapLimit === "Không giới hạn"
                      ? "∞"
                      : parseInt(currentSubscription.plan.swapLimit) - currentSubscription.usedSwaps}
                  </h3>
                  <p className="text-gray-600">Lần đổi còn lại</p>
                  {currentSubscription.plan.swapLimit !== "Không giới hạn" && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${((parseInt(currentSubscription.plan.swapLimit) - currentSubscription.usedSwaps) /
                            parseInt(currentSubscription.plan.swapLimit)) * 100}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="text-center p-6 bg-white/60 rounded-3xl">
                  <h3 className="text-3xl font-bold text-purple-600 mb-2">
                    {new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')}
                  </h3>
                  <p className="text-gray-600">Ngày hết hạn</p>
                  <Button variant="outline" className="mt-2 text-sm">Gia hạn</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-gray-50 to-slate-50 animate-fade-in rounded-3xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-gray-500 to-slate-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-2xl mr-4">
                  <Battery className="h-6 w-6 text-white" />
                </div>
                Bạn chưa có gói thuê pin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Chọn một gói bên dưới để bắt đầu sử dụng dịch vụ</p>
            </CardContent>
          </Card>
        )}

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
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{pkg.name}</CardTitle>
                  {/* <CardDescription className="text-gray-600 text-base mb-4">{pkg.description}</CardDescription> */}
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {pkg.price} VNĐ
                    <span className="text-base text-gray-500 font-normal">/{pkg.period}</span>
                  </div>
                  {pkg.popular && (<div className="flex items-center justify-center text-green-600 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Tiết kiệm 20% so với gói cơ bản
                  </div>)}
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  <ul className="space-y-4 mb-8">
                    {pkg.features.map((feature, index) => (<li key={index} className="flex items-center">
                      <div className={`p-1 bg-gradient-to-r ${pkg.color} rounded-full mr-3`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>))}
                  </ul>

                  <Button
                    onClick={() => {
                      // Tránh đưa React component (icon) vào history state vì không serializable
                      const { icon, ...plan } = pkg;
                      navigate("/driver/subscriptions/checkout", { state: { plan } });
                    }}
                    className={`w-full h-12 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${pkg.popular
                      ? `bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white`
                      : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {currentSubscription && currentSubscription.plan.planId === pkg.id ? "Gia hạn gói" : "Chọn gói này"}
                  </Button>

                  {pkg.popular && (<div className="flex items-center justify-center mt-3 text-sm text-green-600">
                    <Shield className="h-4 w-4 mr-1" />
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
                <Battery className="h-6 w-6 text-white" />
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
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{usage.station}</p>
                    <p className="text-sm text-gray-600">{usage.date}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-4 w-4 mr-1" />
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
