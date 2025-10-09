import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, Battery, Filter, Map as MapIcon, Navigation, Zap, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { List, Modal, Tooltip } from "antd";
import SimpleGoongMap from "../GoongMap";
import { Progress } from "@/components/ui/progress";
import { getAllStations, getStationNearbyLocation, viewUserVehicles } from "../../services/axios.services";
import { toast } from "sonner";
import { SystemContext } from "../../contexts/system.context";
import ProvinceDistrictWardSelect from "../../components/ProvinceDistrictWardSelect";
const StationFinder = () => {
  const API_KEY = "1a4csCB5dp24aOcHgEBhmGPmY7vPSj8HUVmHzVzN";
  const [filters, setFilters] = useState({
    distance: "50",
    batteryType: "",
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [primaryStation, setPrimaryStation] = useState(null);
  const [uniqueVehicleTypes, setUniqueVehicleTypes] = useState([]); //
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { userVehicles, setUserVehicles, userData } = useContext(SystemContext);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [filterAddress, setFilterAddress] = useState({})
  //Tránh trùng value vì nhiều loại xe trùng value pin type
  const [vehicleSelectValue, setVehicleSelectValue] = useState('ALL');

  // Auto-select batteryType của xe đầu tiên nếu chưa chọn (chỉ chạy khi danh sách thay đổi lần đầu)
  useEffect(() => {
    if (!filters.batteryType && uniqueVehicleTypes.length > 0) {
      const first = uniqueVehicleTypes[0];
      setFilters(f => ({ ...f, batteryType: first.batteryType }));
      setVehicleSelectValue(`0_${first.batteryType}`);
    }
  }, [uniqueVehicleTypes]);

  //Reload page mà danh sách xe trước đó bị null thì load lại
  const loadUserVehicles = async () => {
    try {
      const res = await viewUserVehicles();
      if (Array.isArray(res)) {
        setUserVehicles(res);
      } else if (res?.error) {
        toast({
          title: "Lỗi gọi hiển thị xe",
          description: JSON.stringify(res.error),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi mạng khi tải xe",
        description: String(err?.message ?? err),
        variant: "destructive",
      });
    }
  };
  const vehiclesEmpty = !Array.isArray(userVehicles) || userVehicles.length === 0;
  useEffect(() => {
    if (vehiclesEmpty && userData?.userId) {
      loadUserVehicles();
    }
  }, [vehiclesEmpty, userData?.userId]);

  // Lấy danh sách loại xe duy nhất từ userVehicles để hiển thị trong bộ lọc
  useEffect(() => {
    if (Array.isArray(userVehicles) && userVehicles.length > 0) {
      // Map theo vehicleType -> lấy chiếc đầu tiên của mỗi loại
      const uniqueTypes = [...new Map(userVehicles.map(v => [v.vehicleType, v])).values()];
      setUniqueVehicleTypes(uniqueTypes);
    } else {
      setUniqueVehicleTypes([]);
    }
  }, [userVehicles]);


  //filter các trạm dựa trên khoảng cách và loại xe
  const filteredStations = stations.filter(station => {
    //theo địa chỉ
    if (filterAddress && (filterAddress.provinceName || filterAddress.districtName || filterAddress.wardName)) {
      if (!matchByFilterAddress(station.address, filterAddress)) return false;
    }
    //theo battery type
    if (filters.batteryType) {
      const match = station.batteries.some(
        b => b.batteryType === filters.batteryType
      );
      if (!match) return false;
    }

    //theo distance (kiểm tra khoảng cách thực tế từ Goong API)
    if (filters.distance && station.distance && station.distance !== "—") {
      const maxDistance = parseInt(filters.distance, 10);

      const distanceMatch = station.distance.match(/(\d+\.?\d*)/);
      if (distanceMatch) {
        const stationDistance = parseFloat(distanceMatch[1]);
        if (stationDistance > maxDistance) return false; // Loại bỏ trạm xa hơn filter
      }
    }
    return true;
  });


  // --- Chuẩn hoá & tách địa chỉ thành các mảnh theo dấu phẩy ---
  const normalizeVi = (s = "") =>
    s.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")// bỏ dấu
      .replace(/\./g, "")// bỏ dấu chấm
      .toLowerCase()
      .trim();

  const stripPrefixes = (s = "") => {
    let x = " " + normalizeVi(s) + " ";
    //Bỏ tiền tố phổ biến để tránh nhầm lẫn khi so khớp.
    const prefixes = ["phuong", "xa", "thi tran", "quan", "huyen", "thi xa", "thanh pho", "tp", "tp ho chi minh", "tp hcm"];
    prefixes.forEach(p => { x = x.replace(new RegExp(`\\s${p}\\s`, "g"), " "); });
    //Bỏ khoảng cách trắng thừa.
    return x.trim().replace(/\s+/g, " ");
  };

  // Tách address thành các phần nhỏ hơn để so sánh theo từng phần.
  const splitAddr = (address = "") =>
    address.split(",").map(p => stripPrefixes(p)).filter(Boolean);

  // Giữ hàm này cho district/ward (khớp nguyên cụm, có boundary)
  // esc để xóa các ký tự đặc biệt trong regex
  const esc = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Kiểm tra xem chuỗi hay có chứa nguyên cụm needle không (có boundary) tranh trường hợp Quận 1 khớp với Quận 10
  const containsWholePhrase = (hay = "", needle = "") => {
    if (!needle) return true;
    const H = stripPrefixes(hay);
    const pattern = needle
      .split(/\s+/)
      .map(t => esc(stripPrefixes(t)))
      .filter(Boolean)
      .join("\\W+");
    if (!pattern) return true;
    const re = new RegExp(`(?:^|\\W)${pattern}(?:\\W|$)`, "i");
    return re.test(H);
  };

  // --- SO KHỚP THEO ĐUÔI ĐỊA CHỈ ---
  const matchByFilterAddress = (stationAddress = "", fa = {}) => {
    const parts = splitAddr(stationAddress);
    const provincePart = parts.at(-1) || ""; // mảnh cuối (lấy cái cuói cùng của mảng)
    const districtPart = parts.at(-2) || ""; // mảnh kế cuối
    const wardPart = parts.at(-3) || ""; // mảnh trước đó

    // 1) Province: bắt buộc so sánh "bằng nhau" với mảnh cuối tránh trường hợp "Xa Lộ Hà Nội" với tỉnh "Hà Nội"
    if (fa?.provinceName) {
      const wantedProvince = stripPrefixes(fa.provinceName);
      if (provincePart !== wantedProvince) return false;
    }

    // 2) District: nên khớp trong mảnh district, không quét toàn chuỗi
    if (fa?.districtName) {
      if (!containsWholePhrase(districtPart, fa.districtName)) return false;
    }

    // 3) Ward: khớp trong mảnh ward
    if (fa?.wardName) {
      if (!containsWholePhrase(wardPart, fa.wardName)) return false;
    }

    return true;
  };

  // --- End Utils ---



  //Dùng để trả về thêm khoảng cách và thời gian ước lượng và mảng trạm
  const distanceMatrixWithStations = async (origin, stations) => {

    if (!Array.isArray(stations) || stations.length === 0 || !origin?.lat || !origin?.lng) {
      return Array.isArray(stations) ? stations : [];
    }

    // Lấy lat/lng của trạm 
    const toLat = s => s?.latitude;
    const toLng = s => s?.longitude;
    // Tạo chuỗi destinations cho API goong map
    const destinations = stations
      .map(s => `${toLat(s)},${toLng(s)}`)
      .join("|");
    const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origin.lat},${origin.lng}&destinations=${destinations}&vehicle=car&api_key=${API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        // If map API fails, return stations with fallback values but don't crash
        toast.error?.({
          title: "Lỗi lấy khoảng cách",
          description: `Map API lỗi: ${res.status} ${res.statusText}`,
          variant: "destructive",
        });
        return stations.map((station) => ({ ...station, distance: "—", estimatedTime: "—" }));
      }
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
    } catch (err) {
      // Network or parsing error
      toast({
        title: "Lỗi kết nối bản đồ",
        description: String(err.message ?? err),
        variant: "destructive",
      });
      return stations.map((station) => ({ ...station, distance: "—", estimatedTime: "—" }));
    }
  }



  const autoLocation = () => {
    // Nếu trình duyệt không hỗ trợ GPS
    if (!navigator.geolocation) {
      console.log("[GPS] not supported");
      setGpsAvailable(false);
      getAllStation(true);
      return;
    }

    // Thử lấy vị trí hiện tại
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsAvailable(true);

        try {
          const res = await fetch(`https://rsapi.goong.io/geocode?latlng=${lat},${lng}&api_key=${API_KEY}`);
          const data = await res.json();
          const address = data?.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedLocation({ lat, lng, address });
        } catch {
          setSelectedLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        }
      },
      (err) => {
        console.warn("[GPS] error:", err.message);
        // Khi bị chặn hoặc lỗi -> hiển thị tất cả trạm
        setGpsAvailable(false);
        getAllStation(true);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };



  useEffect(() => {
    autoLocation();
    getAllStation();
  }, []);

  // Cập nhật primaryStation khi filter thay đổi
  useEffect(() => {
    setPrimaryStation(filteredStations && filteredStations.length > 0 ? filteredStations[0] : null);
  }, [filteredStations]);



  //Chạy khi thay đổi vị trí hoặc distance
  useEffect(() => {
    if (selectedLocation?.lat != null && selectedLocation?.lng != null) {
      const radius = filters.distance ? parseInt(filters.distance, 10) : 50; // mặc định 50km nếu chưa có
      getStationNearby(selectedLocation.lat, selectedLocation.lng, radius);
    }
  }, [selectedLocation, filters.distance]);

  console.log("Selected Location:", selectedLocation);


  const getStationNearby = async (lat, lng, radius) => {
    try {
      const res = await getStationNearbyLocation(lat, lng, radius);
      // Expecting an array of stations from backend
      if (!res) {
        toast({ title: "Lỗi", description: "Không nhận được dữ liệu trạm", variant: "destructive" });
        setStations([]);
        return;
      }
      if (res.error) {
        toast({
          title: "Lỗi gọi thông tin trạm gần nhất",
          description: JSON.stringify(res.error),
          variant: "destructive",
        });
        setStations([]);
        return;
      }
      if (!Array.isArray(res)) {
        // Backend or proxy returned an unexpected shape (e.g., 502 proxied error object)
        toast({
          title: "Dữ liệu trạm không hợp lệ",
          description: JSON.stringify(res),
          variant: "destructive",
        });
        setStations([]);
        return;
      }

      //Thêm vào nearby stations dữ liệu thời gian và khoảng cách trước khi in ra.
      const stationsWithDistance = await distanceMatrixWithStations(selectedLocation, res);

      // Mảng các trạm đã sort
      const sortedStations = stationsWithDistance.sort((a, b) => {
        const getDistanceValue = (distanceText) => {
          if (!distanceText || distanceText === "—") return Infinity; // set vô cực => đẩy xuống cuối sort
          const match = distanceText.match(/(\d+\.?\d*)/); // lấy dạng số.số
          return match ? parseFloat(match[1]) : Infinity; //match[1] là do 1 cặp ngoặc
        };

        const distanceA = getDistanceValue(a.distance);
        const distanceB = getDistanceValue(b.distance);

        return distanceA - distanceB; // sắp xếp theo tăng dần
      });
      setStations(sortedStations);
      setPrimaryStation(sortedStations.length ? sortedStations[0] : null);
    } catch (err) {
      // axios/service could throw; show readable error
      toast({ title: "Lỗi khi gọi trạm gần nhất", description: String(err.message ?? err), variant: "destructive" });
      setStations([]);
    }
  }




  //GetAllStations này dùng cho bản đồ, không dùng cho danh sách trạm gần, để hiển thị thông tin tất cả các trạm trên bản đồ.
  const getAllStation = async (loadToList = false) => {
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
    if (res && loadToList) {
      setStations(res);
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
  // Mở Google Maps với chỉ đường đến trạm đã chọn
  const handleShowWayBtn = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
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
              <p className="text-white/90 text-lg">Tìm kiếm và đặt lịch đổi pin gần bạn</p>
              <div className="flex items-center mt-2 space-x-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {allStations?.length ?? "--/"} trạm đang hoạt động
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Đổi pin chỉ trong vài phút
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
              <Tooltip color='blue' title={selectedLocation?.address}>
                <Input
                  placeholder="Chọn địa chỉ của bạn trên bản đồ..."
                  className="pl-12 pr-4 py-3 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm"
                  value={selectedLocation?.address || ""}
                  readOnly
                />
              </Tooltip>
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <MapPin className="h-4 w-4 text-gray-400" /> </div>
            </div>
              <Button onClick={() => setIsMapOpen(true)} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105 shadow-lg">
                <MapIcon className="h-4 w-4 mr-2" /> Chọn trên bản đồ </Button>
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
                    <SelectItem value="10000000">🥀 Tất cả</SelectItem>
                    <SelectItem value="1">📍 Dưới 1 km</SelectItem>
                    <SelectItem value="5">🚗 Dưới 5 km</SelectItem>
                    <SelectItem value="10">🏃 Dưới 10 km</SelectItem>
                    <SelectItem value="20">🛴 Dưới 20 km</SelectItem>
                    <SelectItem value="50">🚗 Dưới 50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block text-gray-700">Pin theo xe của bạn</label>
                <Select
                  value={vehicleSelectValue}
                  onValueChange={(value) => {
                    if (value === 'ALL') {
                      setVehicleSelectValue('ALL');
                      setFilters({ ...filters, batteryType: '' });
                      return;
                    }
                    // value format: index_batteryType
                    const parts = value.split('_');
                    const bt = parts.slice(1).join('_'); // phòng trường hợp batteryType có '_'
                    setVehicleSelectValue(value);
                    setFilters({ ...filters, batteryType: bt });
                  }}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-purple-500 rounded-xl">
                    <SelectValue placeholder="Chọn xe của bạn" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueVehicleTypes.length > 0 ? (
                      <>
                        <SelectItem value='ALL'>Tất cả</SelectItem>
                        {uniqueVehicleTypes.map((vehicle, index) => {
                          const composite = `${index}_${vehicle.batteryType}`;
                          return (
                            <SelectItem key={composite} value={composite}>
                              🛵 {vehicle.vehicleType} - 🔋 {vehicle.batteryType}
                            </SelectItem>
                          );
                        })}
                      </>
                    ) : (
                      <SelectItem value="0" disabled>
                        Bạn chưa đăng ký xe nào
                      </SelectItem>
                    )}
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
                  <span className="font-semibold text-green-600">{primaryStation ? primaryStation.stationName : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Khoảng cách</span>
                  <span className="font-semibold text-blue-600">{primaryStation ? primaryStation.distance ?? '—' : '—'}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pin có sẵn</span>
                    <span className="text-sm font-semibold text-green-700">{"Đầy " + primaryStation?.availableCount ?? '—'} / {+primaryStation?.totalBatteries ?? '—'}</span>
                  </div>

                  {primaryStation ? (
                    <div className="space-y-1">
                      {Array.isArray(primaryStation.batteries) && primaryStation.batteries.length > 0 ? (
                        primaryStation.batteries.map((b) => (
                          <div key={b.batteryType} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{b.batteryType}</span>
                            <span className="font-medium">
                              <span className="text-green-600">Đầy {b.available}</span>
                              <span className="mx-1 text-gray-400"> ~ </span>
                              <span className="text-blue-600">Sạc {b.charging}</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="font-semibold text-blue-600 text-xs">Không có pin</span>
                      )}
                    </div>
                  ) : (
                    <span className="font-semibold text-blue-600 text-xs">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Thời gian ước tính</span>
                  <span className="font-semibold text-purple-600">{primaryStation ? primaryStation.estimatedTime ?? '—' : '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Station List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông báo khi mất GPS */}
          {
            !gpsAvailable && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3">
                ⚠️ GPS đang tắt/không được cấp quyền. Đang hiển thị <b>tất cả</b> trạm (không có khoảng cách & thời gian ước tính).
              </div>
            )
          }
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Trạm pin gần bạn</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              {filteredStations.length} trạm tìm thấy
            </Badge>
          </div>

          {/* Province District Ward Select with Search Button */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProvinceDistrictWardSelect setFilterAddress={setFilterAddress} />
              </div>
            </div>
          </div>

          {/* Enhanced Station Cards */}
          {/* Test list antd */}
          <List
            itemLayout="vertical"
            dataSource={filteredStations}
            pagination={{
              defaultCurrent: 1,
              pageSize: 5,
              showSizeChanger: false,
            }}

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
                          ✅ Trạm đang hoạt động
                        </Badge> :
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 px-4 py-2 rounded-full font-semibold"
                        >
                          ❌ Trạm tạm ngưng
                        </Badge>}
                    </div>
                    {/* Sửa code */}
                    {/* Battery Information Section - Combined */}
                    <div className="mb-6">
                      {/* Header with Total Batteries */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <Battery className="h-4 w-4 text-white" />
                          </div>
                          Thông tin pin
                        </h4>
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold"
                        >
                          <Battery className="h-3.5 w-3.5 mr-1.5 inline" />
                          {station.totalBatteries} pin
                        </Badge>
                      </div>
                      {/* Battery Types List */}
                      <div className="space-y-2.5">
                        {station.batteries && station.batteries.length > 0 ? (
                          station.batteries
                            .filter((battery) => battery.available > 0 || battery.charging > 0)
                            .map((battery, idx) => {
                              // Map battery type names                          
                              const displayName = battery.batteryType;

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-blue-50/50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md group"
                                >
                                  {/* Battery Type Name */}
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className={`p-1.5 rounded-md 
                                      ${battery.batteryType === "LITHIUM_ION" ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                                        battery.batteryType === "NICKEL_METAL_HYDRIDE" ? "bg-gradient-to-r from-purple-400 to-purple-600" :
                                          "bg-gradient-to-r from-orange-400 to-orange-600"
                                      }`}>
                                      <Battery className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">{displayName}</span>
                                  </div>

                                  {/* Battery Counts */}
                                  <div className="flex items-center gap-3">
                                    {/* Available Batteries */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs font-medium text-gray-600">Sẵn sàng:</span>
                                      <span className="text-sm font-bold text-green-600">{battery.available}</span>
                                    </div>

                                    {/* Charging Batteries */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs font-medium text-gray-600">Sạc:</span>
                                      <span className="text-sm font-bold text-blue-600">{battery.charging}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-center text-gray-500 py-4 text-sm">
                            Không có thông tin pin
                          </div>
                        )}
                      </div>
                      {/* Total Battery Progress Bar */}
                      <div className="mt-6">
                        {(() => {
                          const totalFull = station.availableCount;
                          const totalBatteries = station.totalBatteries;
                          const percentage = totalBatteries > 0 ? (totalFull / totalBatteries) * 100 : 0;

                          return (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Tình trạng pin sẵn sàng</span>
                                <span className="text-sm font-bold text-green-700">{totalFull}/{totalBatteries} pin đầy</span>
                              </div>
                              <Progress
                                value={percentage}
                                className="h-3 bg-green-100"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-4" >
                      <Link to="/driver/reservation" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                          <Battery className="h-5 w-5 mr-3" />
                          Đặt lịch ngay
                        </Button>
                      </Link>
                      <Button onClick={() => handleShowWayBtn(station.latitude, station.longitude)} variant="outline" className="px-8 py-4 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-105 font-semibold">
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
