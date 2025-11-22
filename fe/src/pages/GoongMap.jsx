import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapPin } from "lucide-react";

const MAP_KEY = "2zEDEwkFKORSZzmvBLWqxat3KJEhNEoUjFh8NgLr";   // tiles/style
const API_KEY = "1a4csCB5dp24aOcHgEBhmGPmY7vPSj8HUVmHzVzN";   // REST autocomplete
const STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`;

// Vẽ polygon hình tròn
function drawCircle(lngLat, radiusInMeters) {
    const points = 64;
    const [lng, lat] = lngLat;
    const km = radiusInMeters / 1000;
    const ret = [];
    const dx = km / (111.320 * Math.cos((lat * Math.PI) / 180));
    const dy = km / 110.574;
    for (let i = 0; i < points; i++) {
        const t = (i / points) * (2 * Math.PI);
        ret.push([lng + dx * Math.cos(t), lat + dy * Math.sin(t)]);
    }
    ret.push(ret[0]);
    return ret;
}

export default function SimpleGoongMap({
    heightClass = "h-[60vh]",
    defaultCenter = [106.660172, 10.762622],
    station,            // mảng trạm như JSON bạn gửi
    stations: s2,       // (tuỳ chọn) 
    onLocationSelect,   // Callback khi chọn vị trí (trả về {lng, lat, address})
    selectMode = false, // Bật chế độ chọn vị trí
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const roRef = useRef(null);
    const selectedMarkerRef = useRef(null); // Marker tạm cho vị trí đã chọn

    const [query, setQuery] = useState("");
    const [suggests, setSuggests] = useState([]);
    const [isFocus, setIsFocus] = useState(false);
    const [mapStyle, setMapStyle] = useState(null); // Style đã xóa sprite/glyphs
    const [selectedLocation, setSelectedLocation] = useState(null); // Vị trí đã chọn
    const markersRef = useRef([]); // Lưu markers để dọn dẹp sau
    const [initialCenter, setInitialCenter] = useState(defaultCenter);
    const defaultZoom = 13;
    const userMarkerRef = useRef(null);

    // Lấy data trạm & lọc toạ độ hợp lệ (bỏ lọc active để tránh miss dữ liệu)
    const rawStations = useMemo(() => {
        const src = s2 ?? station ?? [];
        return Array.isArray(src) ? src : [src];
    }, [station, s2]);

    const stations = useMemo(
        () =>
            rawStations.filter(
                (s) => typeof s?.longitude === "number" && typeof s?.latitude === "number"
            ),
        [rawStations]
    );

    // GeoJSON (chỉ name + address)
    const stationsGeoJSON = useMemo(
        () => ({
            type: "FeatureCollection",
            features: stations.map((s) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
                properties: {
                    id: String(s.stationId ?? `${s.longitude},${s.latitude}`),
                    name: s.stationName ?? "Station",
                    address: s.address ?? "",
                },
            })),
        }),
        [stations]
    );

    // Update chống lỗi mạng
    const addOrUpdateCircle = (lngLat, radius = 500) => {
        const map = mapRef.current;
        if (!map) return;

        // Nếu style chưa sẵn sàng: đợi 1 lần 'load' rồi gọi lại
        if (!map.isStyleLoaded()) {
            map.once("load", () => addOrUpdateCircle(lngLat, radius));
            return;
        }

        const data = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "Polygon", coordinates: [drawCircle(lngLat, radius)] },
                },
            ],
        };

        // Tên source/layer dùng cố định để có thể cập nhật lại
        const srcId = "circle";
        const layerId = "circle";

        // Nếu đã có thì chỉ setData; nếu chưa có thì add source/layer
        const existing = map.getSource(srcId);
        if (existing && existing.setData) {
            existing.setData(data);
        } else {
            // Xoá an toàn nếu còn sót
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(srcId)) map.removeSource(srcId);

            map.addSource(srcId, { type: "geojson", data });
            map.addLayer({
                id: layerId,
                type: "fill",
                source: srcId,
                paint: { "fill-color": "#3b82f6", "fill-opacity": 0.25 },
            });
        }
    };

    const addOrUpdateStations = () => {
        const map = mapRef.current;
        if (!map) return;

        // Dọn markers cũ
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!stations.length) return;

        // Tạo marker HTML cho mỗi trạm (KHÔNG CẦN FONT SERVER)
        stations.forEach(s => {
            // Container cho marker + label
            const el = document.createElement('div');
            el.style.cssText = 'display:flex; flex-direction:column; align-items:center; cursor:pointer; pointer-events:auto;';

            // Circle marker
            const circle = document.createElement('div');
            circle.style.cssText = `
                width: 16px;
                height: 16px;
                background: #ff0000ff;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                pointer-events: auto;
            `;

            // Label text
            const label = document.createElement('div');
            label.textContent = s.stationName || 'Station';
            label.style.cssText = `
                margin-top: 4px;
                padding: 2px 6px;
                background: rgba(255,255,255,0.95);
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                color: #333;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                pointer-events: auto;
            `;

            el.appendChild(circle);
            el.appendChild(label);

            // Tạo marker
            const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([s.longitude, s.latitude])
                .addTo(map);

            // Click để show popup - gắn vào container element
            el.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn event bubble lên map
                new maplibregl.Popup({ offset: 20 })
                    .setLngLat([s.longitude, s.latitude])
                    .setHTML(`
                        <div style="font:13px/1.4 ui-sans-serif,system-ui">
                            <div style="font-weight:600;margin-bottom:4px">${s.stationName || 'Station'}</div>
                            ${s.address ? `<div style="color:#6b7280">${s.address}</div>` : ''}
                        </div>
                    `)
                    .addTo(map);
            });

            markersRef.current.push(marker);
        });
    };

    // Fetch style và xóa sprite/glyphs để tránh lỗi 404
    useEffect(() => {
        fetch(STYLE_URL)
            .then(res => res.json())
            .then(style => {
                setMapStyle(style);
            })
            .catch(err => {
                console.error("Failed to load style:", err);
                setMapStyle(null);
            });
    }, []);

    useEffect(() => {
        if (!navigator?.geolocation) return;
        const success = (pos) => {
            const { latitude, longitude } = pos.coords;
            const nextCenter = [longitude, latitude];
            setInitialCenter(nextCenter);
            if (mapRef.current) {
                mapRef.current.flyTo({ center: nextCenter, zoom: 14 });
                addOrUpdateCircle(nextCenter, 500);
                if (userMarkerRef.current) userMarkerRef.current.setLngLat(nextCenter);
            }
        };
        navigator.geolocation.getCurrentPosition(success, () => { }, { enableHighAccuracy: true, timeout: 5000 });
    }, []);

    // Khởi tạo map
    useEffect(() => {
        if (mapRef.current || !mapContainer.current || !mapStyle) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle, // Dùng style đã xóa sprite/glyphs
            center: initialCenter,
            zoom: defaultZoom,
            attributionControl: false,
        });
        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        // Nếu selectMode = true, cho phép click map để chọn vị trí
        if (selectMode) {
            map.on('click', (e) => {
                const { lng, lat } = e.lngLat;

                // Xóa marker cũ nếu có
                if (selectedMarkerRef.current) {
                    selectedMarkerRef.current.remove();
                }

                // Tạo marker mới tại vị trí click
                const el = document.createElement('div');
                el.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                `;
                selectedMarkerRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);

                // Reverse geocoding để lấy địa chỉ
                fetch(`https://rsapi.goong.io/geocode?latlng=${lat},${lng}&api_key=${API_KEY}`)
                    .then(res => res.json())
                    .then(data => {
                        const address = data?.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        setSelectedLocation({ lng, lat, address });
                    })
                    .catch(() => {
                        setSelectedLocation({ lng, lat, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
                    });
            });

            // Thay đổi cursor khi hover
            map.getCanvas().style.cursor = 'crosshair';
        }

        map.on("load", () => {
            if (userMarkerRef.current) userMarkerRef.current.remove();
            userMarkerRef.current = new maplibregl.Marker().setLngLat(initialCenter).addTo(map);
            addOrUpdateCircle(initialCenter, 500);
            addOrUpdateStations();  // add trạm
            setTimeout(() => map.resize(), 50);
        });

        // Resize theo container (Modal, Drawer…)
        roRef.current = new ResizeObserver(() => map.resize());
        roRef.current.observe(mapContainer.current);

        return () => {
            roRef.current?.disconnect();
            if (selectedMarkerRef.current) selectedMarkerRef.current.remove();
            if (userMarkerRef.current) userMarkerRef.current.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [mapStyle, selectMode, initialCenter]); // Re-init khi mapStyle load xong

    useEffect(() => {
        if (!mapRef.current) return;
        if (!initialCenter) return;
        mapRef.current.flyTo({ center: initialCenter, zoom: 14 });
        addOrUpdateCircle(initialCenter, 500);
        if (userMarkerRef.current) userMarkerRef.current.setLngLat(initialCenter);
    }, [initialCenter]);

    // Dữ liệu trạm đổi → cập nhật source (không đổi style nên không cần re-add liên tục)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource("stations");
        if (src && src.setData) {
            src.setData(stationsGeoJSON);
        } else {
            if (map.isStyleLoaded()) addOrUpdateStations();
            else map.once("load", addOrUpdateStations);
        }
    }, [stationsGeoJSON]);

    // Autocomplete Goong REST
    useEffect(() => {
        const t = setTimeout(async () => {
            if (!query.trim()) { setSuggests([]); return; }
            try {
                const url = `https://rsapi.goong.io/place/autocomplete?api_key=${API_KEY}&input=${encodeURIComponent(query)}`;
                const res = await fetch(url);
                const data = await res.json();
                setSuggests(data?.predictions ?? []);
            } catch {
                setSuggests([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    const chooseSuggest = async (placeId) => {
        try {
            const url = `https://rsapi.goong.io/place/detail?api_key=${API_KEY}&place_id=${placeId}`;
            const res = await fetch(url);
            const data = await res.json();
            const { location } = data?.result?.geometry || {};
            if (!location) return;
            const lngLat = [location.lng, location.lat];
            const address = data?.result?.formatted_address || data?.result?.name || "";

            // Nếu selectMode, set vị trí đã chọn thay vì vẽ marker/circle
            if (selectMode) {
                // Xóa marker cũ
                if (selectedMarkerRef.current) {
                    selectedMarkerRef.current.remove();
                }

                // Tạo marker mới
                const el = document.createElement('div');
                el.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                `;

                selectedMarkerRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat(lngLat)
                    .addTo(mapRef.current);

                setSelectedLocation({ lng: location.lng, lat: location.lat, address });
                mapRef.current.flyTo({ center: lngLat, zoom: 15 });
            } else {
                new maplibregl.Marker().setLngLat(lngLat).addTo(mapRef.current);
                addOrUpdateCircle(lngLat, 500);
                mapRef.current.flyTo({ center: lngLat, zoom: 15 });
            }
            setSuggests([]);
            setQuery("");
            setIsFocus(false);
        } catch { }
    };

    // Effect để gọi callback khi selectedLocation thay đổi
    useEffect(() => {
        if (selectedLocation && onLocationSelect) {
            onLocationSelect(selectedLocation);
        }
    }, [selectedLocation, onLocationSelect]);

    return (
        <div className={`relative w-full ${heightClass}`}>
            <div className="absolute inset-0 rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5">
                <div ref={mapContainer} className="w-full h-full bg-gray-100" />
            </div>

            {/* Hiển thị thông tin vị trí đã chọn khi selectMode = true */}
            {selectMode && selectedLocation && (
                <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-1">Vị trí đã chọn</h4>
                                <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay: chỉ ô tìm kiếm, không còn nút đổi style */}
            <div className="pointer-events-none absolute left-4 right-4 top-4 z-10">
                <div className="pointer-events-auto w-full lg:max-w-md">
                    <div className="relative">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocus(true)}
                            placeholder="Tìm địa điểm (Autocomplete)…"
                            className="w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-10 py-3 text-sm shadow-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                            </svg>
                        </div>

                        {isFocus && suggests.length > 0 && (
                            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                                {suggests.map((s) => (
                                    <button
                                        key={s.place_id}
                                        onClick={() => chooseSuggest(s.place_id)}
                                        className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        {s.description}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
