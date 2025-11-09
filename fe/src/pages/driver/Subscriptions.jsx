import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Battery, Check, Crown, Star, Zap, Shield, TrendingUp } from "lucide-react";
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Popconfirm, Progress } from 'antd';
import { Link, useNavigate } from "react-router-dom";
import {
  getAllPlans, getDriverSubscription, getBookingHistoryByUserId, cancelAutoRenewSubscription, cancelSubscriptionImmediate
} from "../../services/axios.services";
import { useToast } from "@/hooks/use-toast";


import { useEffect, useState, useContext } from "react";
import { SystemContext } from "../../contexts/system.context";
import dayjs from "dayjs";

const Subscriptions = () => {
  const { userData, setUserData } = useContext(SystemContext);
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true); //loading đợi danh sách gói
  const [usageHistory, setUsageHistory] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansResponse = await getAllPlans();
        console.log("✅All Subscription Plans response:", plansResponse);

        if (plansResponse && plansResponse.success && plansResponse.plans) {
          setPackages(plansResponse.plans);
        }
        // Fetch current subscription
        if (userData && userData.userId) {
          const subscriptionResponse = await getDriverSubscription(userData.userId);
          console.log("✅User subscription response:", subscriptionResponse);

          if (subscriptionResponse && subscriptionResponse.success && subscriptionResponse.subscription) {
            setCurrentSubscription(subscriptionResponse.subscription);
          }

          // Fetch booking history and filter by SUBSCRIPTION payment method
          const bookingHistory = await getBookingHistoryByUserId(userData.userId);
          console.log("✅Booking history response:", bookingHistory);
          const bookingHistoryData = bookingHistory.data || [];
          if (bookingHistoryData && Array.isArray(bookingHistoryData)) {
            // Filter bookings with SUBSCRIPTION payment method and sort by date
            const subscriptionBookings = bookingHistoryData
              .filter(booking => booking.payment?.paymentMethod === "SUBSCRIPTION")
              .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            setUsageHistory(subscriptionBookings);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: 'Lỗi tải dữ liệu',
          description: 'Không thể tải dữ liệu gói thuê pin',
          variant: 'destructive',
        });
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

  const handleCancelAutoRenew = async () => {
    if (currentSubscription) {
      const response = await cancelAutoRenewSubscription(userData.userId);
      console.log("✅Cancel auto-renew response:", response);
      if (response && response.success) {
        toast({
          title: 'Hủy gia hạn tự động thành công!',
          description: response?.message || 'Gói thuê pin của bạn sẽ không tự động gia hạn',
          className: 'bg-green-500 text-white',
        });
        setCurrentSubscription(prev => ({ ...prev, autoRenew: false }));
        // setLoading(true);
      } else {
        toast({
          title: 'Hủy gia hạn thất bại',
          description: response?.error || 'Không thể hủy gia hạn tự động. Vui lòng thử lại',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCancelSubscriptionImmediate = async () => {
    if (currentSubscription) {
      const response = await cancelSubscriptionImmediate(userData.userId);
      console.log("✅Cancel subscription immediate response:", response);
      if (response && response.success) {
        toast({
          title: 'Hủy gói thuê pin thành công!',
          description: response?.message || 'Gói thuê pin của bạn đã được hủy',
          className: 'bg-green-500 text-white',
        });
        setCurrentSubscription(null);
        setUserData(prev => ({ ...prev, activeSubscriptionId: null, planName: null, usedSwaps: 0, maxSwaps: 0 }));
      } else {
        toast({
          title: 'Hủy gói thất bại',
          description: 'Không thể hủy gói thuê pin. Vui lòng thử lại',
          variant: 'destructive',
        });
      }
    }
  };

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
                    Gói {currentSubscription.plan.planName}
                  </h3>
                  <p className="text-gray-600">{currentSubscription.autoRenew ? "Đang bật gia hạn tự động" : "Đã tắt tự động gia hạn"}</p>
                  {currentSubscription.plan.planName === "PREMIUM" && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Gói phổ biến</Badge>
                  )}
                </div>
                <div className="text-center p-6 bg-white/60 rounded-3xl">

                  <p className="text-gray-600">Bạn đã dùng</p>
                  <Progress
                    type="circle"
                    percent={parseInt(currentSubscription.usedSwaps / currentSubscription.plan.swapLimit) * 100}
                    format={() => `${currentSubscription.usedSwaps}/${currentSubscription.plan.swapLimit}`}
                  />


                </div>
                <div className="text-center p-6 bg-white/60 rounded-3xl">
                  <h3 className="text-3xl font-bold text-purple-600 mb-2">
                    {new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')}
                  </h3>
                  <p className="text-gray-600">Ngày hết hạn</p>
                  {currentSubscription.autoRenew && (
                    <Popconfirm
                      title="Hủy gia hạn"
                      description="Bạn có chắc chắn muốn hủy gia hạn tự động?"
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                      cancelText="Không"
                      okText="Hủy"
                      onConfirm={() => { handleCancelAutoRenew() }}
                    >
                      <Button variant="outline" className="mt-2 text-sm" >Hủy gia hạn</Button>
                    </Popconfirm>
                  )}
                  <Popconfirm
                    title="Hủy gói tháng"
                    description="Hành động này sẽ hủy gói thuê pin của bạn ngay lập tức."
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    cancelText="Không"
                    okText="Hủy"
                    onConfirm={() => { handleCancelSubscriptionImmediate() }}
                  >
                    <Button variant="outline" className="mt-2 text-sm">Hủy gói</Button>
                  </Popconfirm>
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
              // Helper function to get display name
              const getDisplayName = (planName) => {
                switch (planName) {
                  case "BASIC": return "Gói Cơ bản";
                  case "PREMIUM": return "Gói Premium";
                  case "BUSINESS": return "Gói Doanh nghiệp";
                  default: return planName;
                }
              };

              // Helper function to get icon
              const getIcon = (planName) => {
                switch (planName) {
                  case "BASIC": return Battery;
                  case "PREMIUM": return Star;
                  case "BUSINESS": return Crown;
                  default: return Battery;
                }
              };

              // Helper function to get color
              const getColor = (planName) => {
                switch (planName) {
                  case "BASIC": return "from-blue-500 to-indigo-500";
                  case "PREMIUM": return "from-green-500 to-emerald-500";
                  case "BUSINESS": return "from-purple-500 to-pink-500";
                  default: return "from-gray-500 to-slate-500";
                }
              };

              // Helper function to get background color
              const getBgColor = (planName) => {
                switch (planName) {
                  case "BASIC": return "from-blue-50 to-indigo-50";
                  case "PREMIUM": return "from-green-50 to-emerald-50";
                  case "BUSINESS": return "from-purple-50 to-pink-50";
                  default: return "from-gray-50 to-slate-50";
                }
              };

              // Split description into features
              const features = pkg.description
                .split('. ')
                .filter(item => item.trim().length > 0)
                .map(item => item.trim().endsWith('.') ? item.trim() : item.trim() + '.');

              const IconComponent = getIcon(pkg.planName);
              const color = getColor(pkg.planName);
              const bgColor = getBgColor(pkg.planName);
              const popular = pkg.planName === "PREMIUM";

              return (<Card key={pkg.planId} className={`relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden group ${popular ? 'ring-2 ring-green-500 scale-105' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                {popular && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 text-sm font-semibold">
                    ⭐ Phổ biến nhất
                  </Badge>
                </div>)}

                <div className={`h-3 bg-gradient-to-r ${color}`}></div>

                <CardHeader className="text-center pb-6">
                  <div className={`mx-auto mb-6 p-4 bg-gradient-to-br ${bgColor} rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{getDisplayName(pkg.planName)}</CardTitle>
                  {/* <CardDescription className="text-gray-600 text-base mb-4">{pkg.description}</CardDescription> */}
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {pkg.price.toLocaleString('vi-VN')} VNĐ
                    <span className="text-base text-gray-500 font-normal">/tháng</span>
                  </div>
                  {popular && (<div className="flex items-center justify-center text-green-600 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Tiết kiệm 20% so với gói cơ bản
                  </div>)}
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  <ul className="space-y-4 mb-8">
                    {features.map((feature, index) => (<li key={index} className="flex items-center">
                      <div className={`p-1 bg-gradient-to-r ${color} rounded-full mr-3`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>))}
                  </ul>

                  <Button
                    disabled={!!currentSubscription}
                    onClick={() => {
                      navigate("/driver/subscriptions/checkout", { state: { plan: pkg } });
                    }}
                    className={`w-full h-12 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${popular
                      ? `bg-gradient-to-r ${color} hover:opacity-90 text-white`
                      : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    variant={popular ? "default" : "outline"}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {!!currentSubscription ? "Đã có gói" : "Chọn gói này"}
                  </Button>


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
              {usageHistory.length > 0 ? (
                usageHistory.map((booking) => {
                  const getStatusInfo = (status) => {
                    switch (status) {
                      case "COMPLETED":
                        return { label: "Đã hoàn thành", color: "green" };
                      case "CANCELLED":
                        return { label: "Đã hủy", color: "red" };
                      case "FAILED":
                        return { label: "Thất bại", color: "gray" };
                      default:
                        return { label: "Đang xử lý", color: "blue" };
                    }
                  };

                  const statusInfo = getStatusInfo(booking.bookingStatus);

                  return (
                    <div key={booking.bookingId} className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{booking.stationName}</p>
                          <p className="text-sm text-gray-600">
                            {dayjs(booking.bookingDate).format("DD/MM/YYYY")} - {booking.timeSlot}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {booking.vehicleType} ({booking.batteryCount} pin)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            statusInfo.color === "green"
                              ? "bg-green-100 text-green-800"
                              : statusInfo.color === "red"
                                ? "bg-red-100 text-red-800"
                                : statusInfo.color === "blue"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Gói: {booking.subscriptionPlanName}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Battery className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Chưa có lịch sử sử dụng gói thuê bao</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Subscriptions;
