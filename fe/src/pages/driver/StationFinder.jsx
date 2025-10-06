import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, Battery, Filter, Map, Navigation, Zap, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { List, Modal } from "antd";
import SimpleGoongMap from "../GoongMap";
import { getAllStations, getStationNearbyLocation } from "../../services/axios.services";
import { toast } from "sonner";
const StationFinder = () => {
  const API_KEY = "1a4csCB5dp24aOcHgEBhmGPmY7vPSj8HUVmHzVzN";
  const [filters, setFilters] = useState({
    distance: "",
    batteryCount: ""
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);


  const distanceMatrixWithStations = async (origin, stations) => {
    if (!origin?.lat || !origin?.lng || stations.length === 0) {
      return stations ?? [];
    }

    // Lấy lat/lng của trạm 
    const toLat = s => s?.latitude;
    const toLng = s => s?.longitude;
    // Tạo chuỗi destinations cho API goong map
    const destinations = stations
      .map(s => `${toLat(s)},${toLng(s)}`)
      .join("|");
    const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origin.lat},${origin.lng}&destinations=${destinations}&vehicle=car&api_key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const elems = data?.rows?.[0]?.elements ?? [];
    return stations.map((station, index) => {
      const el = elems[index] ?? {}
      return {
        ...station,
        distance: el?.distance?.text ?? "—",
        estimatedTime: el?.duration?.text ?? "—",
      }
    })
  }



  const autoLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    if (!selectedLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Vị trí hiện tại của bạn"
          });
        },
        (err) => {
          alert(err.message);
        }
      );
    }
  };

  useEffect(() => {
    autoLocation();
    getAllStation();
  }, []);

  //kiểm tra selectedLocation thay đổi thì gọi API + selectLocation tồn tại trước.
  useEffect(() => {
    if (selectedLocation?.lat != null && selectedLocation?.lng != null) {
      getStationNearby(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  console.log("Selected Location:", selectedLocation);

  const getStationNearby = async (lat, lng) => {
    const res = await getStationNearbyLocation(lat, lng);
    if (res) {
      //Thêm vào nearby stations dữ liệu thời gian và khoảng cách trước khi in ra.
      const stationsWithDistance = await distanceMatrixWithStations(selectedLocation, res);
      console.log("thông tin trạm gần nhất:", stationsWithDistance);
      setStations(stationsWithDistance);
    } else if (res.error) {
      toast({
        title: "Lỗi gọi thông tin trạm gần nhất",
        description: JSON.stringify(res.error),
        variant: "destructive",
      });
    }
  }

  //GetAllStations này dùng cho bản đồ, không dùng cho danh sách trạm gần, để hiển thị thông tin tất cả các trạm trên bản đồ.
  const getAllStation = async () => {
    const res = await getAllStations();
    if (res) {
      setAllStations(res);
    } else if (res.error) {
      toast({
        title: "Lỗi gọi thông tin trạm",
        description: JSON.stringify(res.error),
        variant: "destructive",
      });
    }
  }

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleMapOk = () => {
    if (selectedLocation) {
    }
    setIsMapOpen(false);
  };

  return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* Enhanced Header with Glass Effect */}
    <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-repeat animate-pulse" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Content */}
      <div className="relative z-20 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <MapPin className="h-10 w-10 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Trạm Pin Thông Minh</h1>
              <p className="text-white/90 text-lg">Tìm kiếm và đặt lịch trạm pin gần bạn</p>
              <div className="flex items-center mt-2 space-x-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  15 trạm đang hoạt động
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Sạc nhanh 2-5 phút
                </span>
              </div>
            </div>
          </div>
          <Link to="/driver">
            <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
    {/* Main Content with Better Spacing */}
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="grid lg:grid-cols-3 gap-8"> {/* Left Column - Search & Filters */}
        <div className="lg:col-span-1 space-y-6"> {/* Location Search Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                  <Navigation className="h-5 w-5 text-white" />
                </div> Vị trí của bạn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4"> <div className="relative">
              <Input
                placeholder="Chọn địa chỉ của bạn trên bản đồ..."
                className="pl-12 pr-4 py-3 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm"
                value={selectedLocation?.address || ""}
                readOnly
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <MapPin className="h-4 w-4 text-gray-400" /> </div>
            </div>
              <Button onClick={() => setIsMapOpen(true)} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105 shadow-lg">
                <Map className="h-4 w-4 mr-2" /> Chọn trên bản đồ </Button>
              <Modal
                title="Chọn vị trí trên bản đồ"
                centered
                open={isMapOpen}
                onOk={handleMapOk}
                onCancel={() => setIsMapOpen(false)}
                width={1200}
                okText="Xác nhận"
                cancelText="Hủy"
                okButtonProps={{
                  disabled: !selectedLocation,
                  className: "bg-gradient-to-r from-blue-500 to-indigo-500"
                }}
              >
                <div className="w-full bg-gray-100 flex items-center justify-center" style={{ height: '80vh' }}>
                  <SimpleGoongMap
                    station={allStations}
                    selectMode={true}
                    onLocationSelect={handleLocationSelect}
                    heightClass="h-full"
                  />
                </div>
              </Modal>
            </CardContent>
          </Card>
          {/* Enhanced Filters */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                Bộ lọc tìm kiếm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block text-gray-700">Khoảng cách</label>
                <Select onValueChange={(value) => setFilters({ ...filters, distance: value })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-purple-500 rounded-xl">
                    <SelectValue placeholder="Chọn khoảng cách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">📍 Dưới 1 km</SelectItem>
                    <SelectItem value="5">🚗 Dưới 5 km</SelectItem>
                    <SelectItem value="10">🏃 Dưới 10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-3 block text-gray-700">Số lượng pin</label>
                <Select onValueChange={(value) => setFilters({ ...filters, batteryCount: value })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-purple-500 rounded-xl">
                    <SelectValue placeholder="Chọn số lượng pin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">🔋 Trên 5 pin</SelectItem>
                    <SelectItem value="10">🔋🔋 Trên 10 pin</SelectItem>
                    <SelectItem value="15">🔋🔋🔋 Trên 15 pin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Thống kê nhanh</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trạm gần nhất</span>
                  <span className="font-semibold text-green-600">2.5 km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pin có sẵn</span>
                  <span className="font-semibold text-blue-600">25 pin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Thời gian ước tính</span>
                  <span className="font-semibold text-purple-600">2-5 phút</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Station List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Trạm pin gần bạn</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              {stations.length} trạm tìm thấy
            </Badge>
          </div>

          {/* Enhanced Station Cards */}
          {/* Test list antd */}
          <List
            itemLayout="vertical"
            dataSource={stations}
            renderItem={(station, index) => (
              <List.Item key={station.stationId}>
                <Card className="space-y-6 border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden group" style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Card Header with Gradient */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                  <CardContent className="p-8">
                    {/* Station Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{station.stationName}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.floor(station.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />))}
                              </div>
                              <span className="text-sm font-semibold text-yellow-600">{station.rating}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {station.address}
                          </p>
                          <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1 font-medium text-blue-600">
                              <Navigation className="h-4 w-4" />
                              {station.distance}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-green-600">
                              <Clock className="h-4 w-4" />
                              {station.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      {station.active ?
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                          ✅ {station.status}
                        </Badge> :
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 px-4 py-2 rounded-full font-semibold"
                        >
                          ❌ {station.status}
                        </Badge>}
                    </div>
                    {/* Battery Status with Enhanced Design */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      {/* Battery Counts */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Battery className="h-5 w-5 text-blue-500" />
                          Trạng thái pin
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200 text-center group-hover:scale-105 transition-transform duration-300">
                            <div className="text-3xl font-bold text-green-600 mb-1">{station.batterySummary.AVAILABLE ?? 0}</div>
                            <div className="text-xs font-medium text-green-700">Pin đầy</div>
                            <div className="w-full h-2 bg-green-200 rounded-full mt-3 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 text-center group-hover:scale-105 transition-transform duration-300">
                            <div className="text-3xl font-bold text-blue-600 mb-1">{station.batterySummary.CHARGING ?? 0}</div>
                            <div className="text-xs font-medium text-blue-700">Đang sạc</div>
                            <div className="w-full h-2 bg-blue-200 rounded-full mt-3 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-2xl border border-gray-200 text-center group-hover:scale-105 transition-transform duration-300">
                            <div className="text-3xl font-bold text-gray-500 mb-1">{station.batterySummary.DAMAGED ?? 0}</div>
                            <div className="text-xs font-medium text-gray-600">Pin rỗng</div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                              <div className="h-full bg-gray-400 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Battery Types */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-purple-500" />
                          Loại pin có sẵn
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(station.batteryTypes).map(([type, counts]) => (counts > 0 && (<div key={type} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 group-hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${type === "LITHIUM_ION" ? "bg-blue-100" : "bg-purple-100"}`}>
                                <Battery className={`h-4 w-4 ${type === "LITHIUM_ION" ? "text-blue-600" : "text-purple-600"}`} />
                              </div>
                              <span className="font-medium text-gray-700">{type}</span>
                            </div>
                            <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-semibold px-3 py-1 rounded-full">
                              {counts} pin
                            </Badge>
                          </div>)))}
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {/* <div className="mb-8">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        ⭐ Tiện ích & Dịch vụ
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {station.amenities.map((amenity, idx) => (<Badge key={idx} variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors px-3 py-1 rounded-full">
                            {amenity}
                          </Badge>))}
                      </div>
                    </div> */}

                    {/* Action Buttons */}
                    <div className="flex gap-4" >
                      <Link to="/driver/reservation" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                          <Battery className="h-5 w-5 mr-3" />
                          Đặt lịch ngay
                        </Button>
                      </Link>
                      <Button variant="outline" className="px-8 py-4 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-105 font-semibold">
                        <MapPin className="h-5 w-5 mr-2" />
                        Chỉ đường
                      </Button>
                    </div >
                  </CardContent >
                </Card >
              </List.Item>
            )}
          />
        </div >
      </div >
    </div >
  </div >);
};
export default StationFinder;
