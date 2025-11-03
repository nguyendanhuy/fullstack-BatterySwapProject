// StationFinder.jsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Battery, Filter, Map as MapIcon, Navigation, Zap, Clock, Star } from "lucide-react";
import { List, Modal, Tooltip } from "antd";
import SimpleGoongMap from "../GoongMap";
import { getAllStations, getStationNearbyLocation } from "../../services/axios.services";
import { toast } from "sonner";
import { SystemContext } from "../../contexts/system.context";
import ProvinceDistrictWardSelect from "../../components/ProvinceDistrictWardSelect";
import BookingSummary from "../../components/BookingSummary";
import { useSessionStorage } from "../../hooks/useSessionStorage";

// --- Utils địa chỉ (giữ nguyên tinh thần code cũ) ---
const normalizeVi = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").toLowerCase().trim();

const stripPrefixes = (s = "") => {
  let x = " " + normalizeVi(s) + " ";
  const prefixes = ["phuong", "xa", "thi tran", "quan", "huyen", "thi xa", "thanh pho", "tp", "tp ho chi minh", "tp hcm"];
  prefixes.forEach(p => { x = x.replace(new RegExp(`\\s${p}\\s`, "g"), " "); });
  return x.trim().replace(/\s+/g, " ");
};

const splitAddr = (address = "") => address.split(",").map(p => stripPrefixes(p)).filter(Boolean);

const containsWholePhrase = (hay = "", needle = "") => {
  if (!needle) return true;
  const H = stripPrefixes(hay);
  const pattern = stripPrefixes(needle).split(/\s+/).filter(Boolean).join("\\W+");
  if (!pattern) return true;
  const re = new RegExp(`(?:^|\\W)${pattern}(?:\\W|$)`, "i");
  return re.test(H);
};

const matchByFilterAddress = (stationAddress = "", fa = {}) => {
  const parts = splitAddr(stationAddress);
  const provincePart = parts.at(-1) || "";
  const districtPart = parts.at(-2) || "";
  const wardPart = parts.at(-3) || "";

  if (fa?.provinceName) {
    const wantedProvince = stripPrefixes(fa.provinceName);
    if (provincePart !== wantedProvince) return false; // strict theo tail
  }
  if (fa?.districtName) {
    if (!containsWholePhrase(districtPart, fa.districtName)) return false;
  }
  if (fa?.wardName) {
    if (!containsWholePhrase(wardPart, fa.wardName)) return false;
  }
  return true;
};

// --- Utils distance: chuẩn hoá "m" ↔ "km" ---
const getKm = (text) => {
  if (!text || text === "—") return Infinity;
  const m = String(text).match(/(\d+\.?\d*)\s*(km|m)/i);
  if (!m) return Infinity;
  const val = parseFloat(m[1]);
  const unit = (m[2] || "").toLowerCase();
  return unit === "m" ? val / 1000 : val;
};

const API_KEY = import.meta.env.VITE_GOONG_API_KEY || "1a4csCB5dp24aOcHgEBhmGPmY7vPSj8HUVmHzVzN"; // TODO: chuyển sang env

export default function StationFinder() {
  const [filters, setFilters] = useState({ distance: "50", batteryType: "" });
  const [selectedBatteries, setSelectedBatteries] = useState({}); // (giữ nếu flow cũ cần)
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [primaryStation, setPrimaryStation] = useState(null);
  const [uniqueVehicleTypes, setUniqueVehicleTypes] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { userVehicles, setUserVehicles, userData } = useContext(SystemContext);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [filterAddress, setFilterAddress] = useState({});
  const [vehicleSelectValue, setVehicleSelectValue] = useState("ALL");

  // --- NEW: chọn xe chi tiết & giỏ đặt pin theo xe ---
  const [currentVehicleId, setCurrentVehicleId] = useState(null);
  // Sử dụng useSessionStorage để lưu thông tin đặt pin
  const [selectBattery, setSelectBattery] = useSessionStorage("battery-booking-selection", {});

  const getVehicleRequired = (v) => Number(v?.batteryCount ?? 1);

  const totalQuota = useMemo(() => (
    Array.isArray(userVehicles) ? userVehicles.reduce((s, v) => s + getVehicleRequired(v), 0) : 0
  ), [userVehicles]);

  const totalBooked = useMemo(() => (
    Object.values(selectBattery).reduce((s, it) => s + (Number(it.qty) || 0), 0)
  ), [selectBattery]);

  const z = Math.max(0, totalQuota - totalBooked);

  const assignedAtStationType = (stationId, batteryType) => {
    return Object.values(selectBattery).reduce((sum, it) => {
      if (it.stationInfo?.stationId === stationId && it.batteryType === batteryType) {
        return sum + (Number(it.qty) || 0);
      }
      return sum;
    }, 0);
  };

  const ensureVehicleLine = (vehicleId) => {
    if (!vehicleId) return;
    setSelectBattery((s) => {
      if (s[vehicleId]) return s;
      const vehicle = (userVehicles || []).find(v => String(v.vehicleId) === String(vehicleId));
      if (!vehicle) return s;
      return {
        ...s,
        [vehicleId]: {
          vehicleInfo: {
            vehicleId: String(vehicle.vehicleId),
            vehicleType: vehicle.vehicleType,
            batteryType: vehicle.batteryType,
            batteryCount: vehicle.batteryCount,
          },
          stationInfo: null,
          batteryType: vehicle.batteryType,
          qty: 0,
        }
      };
    });
  };

  const removeVehicleLine = (vehicleId) => {
    setSelectBattery((s) => {
      const { [vehicleId]: _, ...rest } = s;
      return rest;
    });
  };

  // Tăng/giảm qty cho xe cụ thể tại trạm/type
  const updateVehicleSelection = (vehicleId, station, batteryType, delta) => {
    const line = selectBattery[vehicleId];
    if (!line) return;

    // ràng buộc loại pin theo xe
    if (line.vehicleInfo.batteryType !== batteryType) {
      toast.error("Loại pin không khớp xe", { description: "Hãy chọn đúng loại pin của xe." });
      return;
    }

    const bInfo = station?.batteries?.find(b => b.batteryType === batteryType);
    const available = Number(bInfo?.available || 0);

    const alreadyAssigned = assignedAtStationType(station.stationId, batteryType);

    // sameLine chỉ coi là "đang giữ thật" khi qty>0 để đỡ rối
    const meOldQty = Number(line.qty || 0);
    const sameLine =
      meOldQty > 0 &&
      line.stationInfo?.stationId === station.stationId &&
      line.batteryType === batteryType;

    const remainAtStationType = Math.max(0, available - alreadyAssigned + (sameLine ? meOldQty : 0));

    const allowedForThisLine = Math.max(0, totalQuota - (totalBooked - meOldQty)); // trần theo quota tổng, riêng cho dòng đang chỉnh

    const next = Math.max(0, meOldQty + delta);
    if (delta > 0) {
      if (next > line.vehicleInfo.batteryCount) {
        toast.error("Vượt hạn mức tổng", { description: `Tối đa ${line.vehicleInfo.batteryCount} pin cho xe.` });
        return;
      }
      if (allowedForThisLine <= 0) {
        toast.error("Vượt hạn mức tổng", { description: `Tối đa ${totalQuota} pin cho tất cả xe.` });
        return;
      }
      if (next > allowedForThisLine) {
        toast.error("Vượt hạn mức tổng", { description: `Bạn chỉ có thể tăng tối đa đến ${allowedForThisLine} pin cho xe này.` });
        return;
      }
      if (next > remainAtStationType) {
        toast.error("Không đủ pin tại trạm", { description: `Còn ${remainAtStationType} pin ${batteryType} ở trạm này.` });
        return;
      }
    }

    // Nếu muốn: về 0 thì xoá stationInfo cho trực quan hơn
    if (next === 0) {
      setSelectBattery((s) => ({
        ...s,
        [vehicleId]: { ...s[vehicleId], stationInfo: null, qty: 0 }
      }));
      return;
    }

    setSelectBattery((s) => ({
      ...s,
      [vehicleId]: {
        ...s[vehicleId],
        stationInfo: {
          stationId: station.stationId,
          stationName: station.stationName,
          address: station.address,
          latitude: station.latitude,
          longitude: station.longitude,
          rating: station.rating,
          distance: station.distance,
          estimatedTime: station.estimatedTime,
          active: station.active,
        },
        batteryType,
        qty: next,
      }
    }));
  };

  // --- Lấy danh sách loại xe (unique theo vehicleType) để filter nhanh ---
  useEffect(() => {
    if (Array.isArray(userVehicles) && userVehicles.length > 0) {
      const uniqueTypes = [...new Map(userVehicles.map(v => [v.vehicleType, v])).values()];
      setUniqueVehicleTypes(uniqueTypes);
    } else {
      setUniqueVehicleTypes([]);
    }
  }, [userVehicles]);

  // --- Auto select batteryType theo xe đầu tiên nếu chưa chọn ---
  useEffect(() => {
    if (!filters.batteryType && uniqueVehicleTypes.length > 0) {
      const first = uniqueVehicleTypes[0];
      setFilters(f => ({ ...f, batteryType: first.batteryType }));
      setVehicleSelectValue(`0_${first.batteryType}`);
    }
  }, [uniqueVehicleTypes]);

  // --- Lấy vị trí người dùng, reverse geocode để hiển thị địa chỉ ---
  const autoLocation = () => {
    if (!navigator.geolocation) {
      setGpsAvailable(false);
      getAllStation(true);
      return;
    }
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


  // --- Distance Matrix (thêm khoảng cách & thời gian) ---
  const distanceMatrixWithStations = async (origin, stationsList, signal) => {
    if (!Array.isArray(stationsList) || stationsList.length === 0 || !origin?.lat || !origin?.lng) {
      return Array.isArray(stationsList) ? stationsList : [];
    }
    const destinations = stationsList.map(s => `${s?.latitude},${s?.longitude}`).join("|");
    const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origin.lat},${origin.lng}&destinations=${destinations}&vehicle=car&api_key=${API_KEY}`;
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        toast.error("Lỗi lấy khoảng cách", { description: `${res.status} ${res.statusText}` });
        return stationsList.map((station) => ({ ...station, distance: "—", estimatedTime: "—" }));
      }
      const data = await res.json();
      const elems = data?.rows?.[0]?.elements ?? [];
      return stationsList.map((station, index) => {
        const el = elems[index] ?? {};
        return {
          ...station,
          distance: el?.distance?.text ?? "—",
          estimatedTime: el?.duration?.text ?? "—",
        };
      });
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error("Lỗi kết nối bản đồ", { description: String(err.message ?? err) });
      }
      return stationsList.map((station) => ({ ...station, distance: "—", estimatedTime: "—" }));
    }
  };

  // --- Lấy trạm gần vị trí + debounce/abort để tránh chồng request ---
  const nearbyAbortRef = useRef(null);
  const getStationNearby = async (lat, lng, radius) => {
    try {
      const res = await getStationNearbyLocation(lat, lng, radius);
      if (!res) {
        toast.error("Lỗi", { description: "Không nhận được dữ liệu trạm" });
        setStations([]);
        return;
      }
      if (res.error) {
        toast.error("Lỗi gọi thông tin trạm gần nhất", { description: JSON.stringify(res.error) });
        setStations([]);
        return;
      }
      if (!Array.isArray(res)) {
        toast.error("Dữ liệu trạm không hợp lệ", { description: JSON.stringify(res) });
        setStations([]);
        return;
      }

      // distance matrix
      if (nearbyAbortRef.current) nearbyAbortRef.current.abort();
      const controller = new AbortController();
      nearbyAbortRef.current = controller;

      const stationsWithDistance = await distanceMatrixWithStations(selectedLocation, res, controller.signal);

      const sortedStations = stationsWithDistance.sort((a, b) => getKm(a.distance) - getKm(b.distance));
      setStations(sortedStations);
      setPrimaryStation(sortedStations.length ? sortedStations[0] : null);
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error("Lỗi khi gọi trạm gần nhất", { description: String(err.message ?? err) });
      }
      setStations([]);
    }
  };

  // --- Lấy toàn bộ trạm (cho bản đồ) ---
  const getAllStation = async (loadToList = false) => {
    const res = await getAllStations();
    if (res?.error) {
      toast.error("Lỗi gọi thông tin trạm", { description: JSON.stringify(res.error) });
    } else if (res) {
      setAllStations(res);
      if (loadToList) setStations(res);
    }
  };

  // --- Trigger khi đổi vị trí hoặc khoảng cách ---
  useEffect(() => {
    if (selectedLocation?.lat != null && selectedLocation?.lng != null) {
      const radius = filters.distance ? parseInt(filters.distance, 10) : 50;
      const t = setTimeout(() => getStationNearby(selectedLocation.lat, selectedLocation.lng, radius), 250);
      return () => clearTimeout(t);
    }
  }, [selectedLocation, filters.distance]);

  // --- Primary station cập nhật khi filter thay đổi ---
  useEffect(() => {
    setPrimaryStation(stations && stations.length > 0 ? stations[0] : null);
  }, [stations]);

  // --- Lọc trạm theo filter địa chỉ, pin, distance ---
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      if (filterAddress && (filterAddress.provinceName || filterAddress.districtName || filterAddress.wardName)) {
        if (!matchByFilterAddress(station.address, filterAddress)) return false;
      }
      if (filters.batteryType) {
        const match = station.batteries?.some(b => b.batteryType === filters.batteryType);
        if (!match) return false;
      }
      if (filters.distance && station.distance && station.distance !== "—") {
        const maxKm = parseInt(filters.distance, 10);
        const distKm = getKm(station.distance);
        if (distKm > maxKm) return false;
      }
      return true;
    });
  }, [stations, filterAddress, filters.batteryType, filters.distance]);

  const handleLocationSelect = (location) => setSelectedLocation(location);
  const handleMapOk = () => setIsMapOpen(false);

  const handleShowWayBtn = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">Tìm trạm</h1>
        </div>
      </header>

      {/* Main */}
      <div className="container mx-auto px-6 py-8 max-w-screen-2xl">
        {/* 3 columns layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Col 1: Vị trí + Filters + Quick Stats */}
          <div className="lg:col-span-3 space-y-6 order-1">
            {/* Location */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                  Vị trí của bạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Tooltip color="blue" title={selectedLocation?.address}>
                    <Input
                      placeholder="Chọn địa chỉ của bạn trên bản đồ..."
                      className="pl-12 pr-4 py-3 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm"
                      value={selectedLocation?.address || ""}
                      readOnly
                    />
                  </Tooltip>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <Button
                  onClick={() => setIsMapOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Chọn trên bản đồ
                </Button>

                <Modal
                  title="Chọn vị trí trên bản đồ"
                  centered
                  open={isMapOpen}
                  onOk={handleMapOk}
                  onCancel={() => setIsMapOpen(false)}
                  width="80vw"
                  okText="Xác nhận"
                  cancelText="Hủy"
                  okButtonProps={{
                    disabled: !selectedLocation,
                    className: "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }}
                  styles={{ body: { height: '70vh', padding: 0 } }}
                >
                  <div className="w-full bg-gray-100 flex items-center justify-center h-full">
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

            {/* Filters */}
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
                  <Select
                    value={filters.distance}
                    onValueChange={(value) => setFilters({ ...filters, distance: value })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-purple-500 rounded-xl">
                      <SelectValue placeholder="50 km" />
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
                      if (value === "ALL") {
                        setVehicleSelectValue("ALL");
                        setFilters({ ...filters, batteryType: "" });
                        return;
                      }
                      const parts = value.split("_");
                      const bt = parts.slice(1).join("_");
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
                          <SelectItem value="ALL">Tất cả</SelectItem>
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
                        <SelectItem value="0" disabled> Bạn chưa đăng ký xe nào </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
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
                    <span className="font-semibold text-blue-600">{primaryStation ? (primaryStation.distance ?? '—') : '—'}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pin có sẵn</span>
                      <span className="text-sm font-semibold text-green-700">
                        {"Đầy " + (primaryStation?.availableCount ?? '—')} / {(+primaryStation?.totalBatteries ?? '—')}
                      </span>
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
                    <span className="font-semibold text-purple-600">{primaryStation ? (primaryStation.estimatedTime ?? '—') : '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 2: Station List (to nhất) */}
          <div className="lg:col-span-6 space-y-6 order-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">Trạm pin gần bạn</h2>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                {filteredStations.length} trạm tìm thấy
              </Badge>
            </div>

            {!gpsAvailable && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3">
                ⚠️ GPS đang tắt/không được cấp quyền. Đang hiển thị <b>tất cả</b> trạm (không có khoảng cách & thời gian ước tính).
              </div>
            )}


            {/* Province/District/Ward */}
            <div className="mb-2">
              <ProvinceDistrictWardSelect setFilterAddress={setFilterAddress} />
            </div>

            {/* Station Cards */}
            <List
              itemLayout="vertical"
              dataSource={filteredStations}
              pagination={{
                defaultCurrent: 1,
                pageSize: 5,
                showSizeChanger: false,
                locale: { items_per_page: " / trang" },
              }}
              renderItem={(station, index) => (
                <List.Item key={station.stationId}>
                  <Card
                    className="space-y-6 border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <CardContent className="p-8">
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
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(station.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                  ))}
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
                                {station.distance ?? "—"}
                              </span>
                              <span className="flex items-center gap-1 font-medium text-green-600">
                                <Clock className="h-4 w-4" />
                                {station.estimatedTime ?? "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {station.active ? (
                          <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                            Trạm đang sẵn sàng
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                            Trạm tạm ngưng
                          </Badge>
                        )}
                      </div>

                      {/* Battery info */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                          <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                              <Battery className="h-4 w-4 text-white" />
                            </div>
                            Thông tin pin
                          </h4>
                          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold">
                            <Battery className="h-3.5 w-3.5 mr-1.5 inline" />
                            Đầy {station?.availableCount ?? "—"} / {station?.totalBatteries ?? "—"} pin
                          </Badge>
                        </div>

                        <div className="space-y-2.5">
                          {station.batteries && station.batteries.length > 0 ? (
                            station.batteries
                              .filter(b => (b.available > 0 || b.charging > 0))
                              .map((battery) => {
                                const type = battery.batteryType;
                                const alrBased = assignedAtStationType(station.stationId, type);
                                const line = currentVehicleId ? selectBattery[currentVehicleId] : null;
                                const sameStation = !!(line?.stationInfo?.stationId === station.stationId);
                                const sameType = !!(line?.batteryType === type);
                                const meQty = sameStation && sameType ? (line?.qty || 0) : 0;

                                return (
                                  <div
                                    key={type}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                                      ${meQty > 0
                                        ? "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-400 shadow-lg"
                                        : "bg-gradient-to-r from-white to-blue-50/50 border-blue-100 hover:border-blue-300 hover:shadow-md"
                                      }`}
                                  >
                                    {/* Trái: icon + type */}
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`p-1.5 rounded-md transition-all duration-300 
                                          ${type === "LITHIUM_ION"
                                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                            : type === "NICKEL_METAL_HYDRIDE"
                                              ? "bg-gradient-to-r from-purple-400 to-purple-600"
                                              : "bg-gradient-to-r from-orange-400 to-orange-600"
                                          }`}
                                      >
                                        <Battery className="h-3.5 w-3.5 text-white" />
                                      </div>
                                      <span className={`font-semibold text-sm ${meQty > 0 ? "text-blue-700" : "text-gray-800"}`}>
                                        {type}
                                      </span>
                                    </div>

                                    {/* Phải: cụm “Sẵn sàng / Sạc” + nút ± */}
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-md border border-green-200">
                                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                                          <span className="text-xs font-medium text-gray-600">Sẵn sàng:</span>
                                          <span className="text-sm font-bold text-green-600">{battery.available - alrBased}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                          <span className="text-xs font-medium text-gray-600">Sạc:</span>
                                          <span className="text-sm font-bold text-blue-600">{battery.charging}</span>
                                        </div>
                                      </div>

                                      {/* Nút ± */}
                                      <div className="flex items-center gap-2">
                                        <button
                                          disabled={!currentVehicleId}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (currentVehicleId) {
                                              updateVehicleSelection(currentVehicleId, station, type, -1);
                                            }
                                          }}
                                          className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          −
                                        </button>
                                        {meQty > 0 && (
                                          <span className="min-w-6 text-center text-sm font-semibold text-gray-700">
                                            {meQty}
                                          </span>
                                        )}
                                        <button
                                          disabled={!currentVehicleId || !station.active}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (currentVehicleId && station.active) {
                                              updateVehicleSelection(currentVehicleId, station, type, +1);
                                            }
                                          }}
                                          className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-500"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                );
                              })
                          ) : (
                            <div className="text-center text-gray-500 py-4 text-sm">Không có thông tin pin</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleShowWayBtn(station.latitude, station.longitude)}
                          variant="outline"
                          className="px-8 py-4 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                        >
                          <MapPin className="h-5 w-5 mr-2" />
                          Chỉ đường
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </List.Item>
              )}
            />
          </div>

          {/* Col 3: Chọn xe + Booking Summary */}
          <div className="lg:col-span-3 space-y-6 order-3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg mr-3">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Chọn xe chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">Xe</label>
                  <Select
                    value={currentVehicleId ?? ""}
                    onValueChange={(vid) => {
                      setCurrentVehicleId(vid);
                      ensureVehicleLine(vid);
                    }}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-violet-500 rounded-xl">
                      <SelectValue placeholder="Chọn xe để gán pin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(userVehicles) && userVehicles.length > 0 ? (
                        userVehicles.map(v => (
                          <SelectItem key={v.vehicleId} value={String(v.vehicleId)}>
                            🛵 {v.vehicleType} — 🔋 {v.batteryType} (cần {getVehicleRequired(v)})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-" disabled>Chưa có xe</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  Hạn mức tổng: <b>{totalBooked}</b> / {totalQuota} pin
                </div>
              </CardContent>
            </Card>

            <BookingSummary
              selectBattery={selectBattery}
              totalQuota={totalQuota}
              totalBooked={totalBooked}
              onRemove={removeVehicleLine}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
