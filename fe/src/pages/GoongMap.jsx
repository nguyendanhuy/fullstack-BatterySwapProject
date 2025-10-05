import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

// .env (Vite)
const MAP_KEY = "2zEDEwkFKORSZzmvBLWqxat3KJEhNEoUjFh8NgLr";   // style tiles
const API_KEY = "1a4csCB5dp24aOcHgEBhmGPmY7vPSj8HUVmHzVzN";   // REST (autocomplete/place-detail)

const STYLE_NORMAL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`;
const STYLE_SATELLITE = `https://tiles.goong.io/assets/goong_satellite.json?api_key=${MAP_KEY}`;

// Vẽ vòng tròn polygon
function drawCircle(lngLat, radiusInMeters) {
    const points = 64;
    const [lng, lat] = lngLat;
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos((lat * Math.PI) / 180));
    const distanceY = km / 110.574;
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([lng + x, lat + y]);
    }
    ret.push(ret[0]);
    return ret;
}

export default function SimpleGoongMap({
    heightClass = "h-[60vh]",      // ✔️ giúp map khớp với Modal: bodyStyle.height = '60vh'
    defaultCenter = [105.8342, 21.0278], // Hà Nội [lng, lat]
    defaultZoom = 13,
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const roRef = useRef(null);
    const markerRef = useRef(null);

    const [styleUrl, setStyleUrl] = useState(STYLE_NORMAL);
    const [query, setQuery] = useState("");
    const [suggests, setSuggests] = useState([]);
    const [isFocus, setIsFocus] = useState(false);

    // --- helpers: add circle source/layer (id cố định) ---
    const addOrUpdateCircle = (lngLat, radius = 500) => {
        const map = mapRef.current;
        if (!map) return;

        const data = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "Polygon", coordinates: [drawCircle(lngLat, radius)] },
                },
            ],
        };

        if (map.getLayer("circle")) map.removeLayer("circle");
        if (map.getSource("circle")) map.removeSource("circle");

        map.addSource("circle", { type: "geojson", data });
        map.addLayer({
            id: "circle",
            type: "fill",
            source: "circle",
            paint: { "fill-color": "#3b82f6", "fill-opacity": 0.25 }, // xanh nhẹ
        });
    };

    // --- init map ---
    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: defaultCenter,
            zoom: defaultZoom,
            attributionControl: false,
        });
        mapRef.current = map;

        // Controls góc phải
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), "top-right");

        // Marker mặc định + circle khi load
        map.on("load", () => {
            new maplibregl.Marker().setLngLat(defaultCenter).addTo(map);
            addOrUpdateCircle(defaultCenter, 500);

            // gọi resize để ăn khớp modal animation
            setTimeout(() => map.resize(), 50);
        });

        // ResizeObserver để auto-resize theo container (Modal mở/đóng)
        roRef.current = new ResizeObserver(() => map.resize());
        roRef.current.observe(mapContainer.current);

        return () => {
            roRef.current?.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, []); // styleUrl ở đây chỉ để create lần đầu (thực tế ta setStyle ở effect khác)

    // --- đổi style an toàn: re-add circle sau khi style load ---
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            map.setStyle(styleUrl);
            map.once("style.load", () => {
                // re-add circle sau khi đổi style
                const center = map.getCenter();
                addOrUpdateCircle([center.lng, center.lat], 500);
            });
        };
        if (map.isStyleLoaded()) apply();
        else map.once("styledata", apply);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [styleUrl]);

    // --- Autocomplete debounce ---
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

    // --- chọn gợi ý ---
    const chooseSuggest = async (placeId) => {
        try {
            if (!placeId) {
                console.error('[GoongMap] chooseSuggest called without placeId');
                return;
            }
            if (!mapRef.current) {
                console.error('[GoongMap] map not ready');
                return;
            }
            const url = `https://rsapi.goong.io/place/detail?api_key=${API_KEY}&place_id=${encodeURIComponent(placeId)}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.error('[GoongMap] place detail fetch failed', res.status);
                return;
            }
            const data = await res.json();
            const { location } = data?.result?.geometry || {};
            const lng = typeof location?.lng === 'string' ? parseFloat(location.lng) : location?.lng;
            const lat = typeof location?.lat === 'string' ? parseFloat(location.lat) : location?.lat;
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                console.error('[GoongMap] invalid coordinates from place detail', location);
                return;
            }
            const lngLat = [lng, lat];

            // Reuse single marker
            if (markerRef.current) markerRef.current.remove();
            markerRef.current = new maplibregl.Marker().setLngLat(lngLat).addTo(mapRef.current);
            addOrUpdateCircle(lngLat, 500);

            mapRef.current.flyTo({ center: lngLat, zoom: 15 });
            setSuggests([]);
            setQuery("");
            setIsFocus(false);
        } catch (e) {
            console.error('[GoongMap] chooseSuggest error', e);
        }
    };

    return (
        <div className={`relative w-full ${heightClass}`}>
            {/* Khung map (bo góc + shadow) */}
            <div className="absolute inset-0 rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5">
                <div ref={mapContainer} className="w-full h-full bg-gray-100" />
            </div>

            {/* Thanh điều khiển nổi (overlay) */}
            <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 lg:flex-row">
                {/* Ô tìm kiếm */}
                <div className="pointer-events-auto w-full lg:max-w-md">
                    <div className="relative">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocus(true)}
                            placeholder="Tìm địa điểm (Autocomplete)..."
                            className="w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-10 py-3 text-sm shadow-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        {/* icon search */}
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                            </svg>
                        </div>

                        {/* Dropdown gợi ý */}
                        {isFocus && suggests.length > 0 && (
                            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                                {suggests.map((s) => (
                                    <button
                                        key={s.place_id ?? s.placeId ?? s.id}
                                        onClick={() => chooseSuggest(s.place_id ?? s.placeId ?? s.id)}
                                        className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        {s.description}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Nút đổi style */}
                <div className="pointer-events-auto flex gap-2">
                    <button
                        onClick={() => setStyleUrl(STYLE_NORMAL)}
                        className={`rounded-lg px-4 py-2 text-sm shadow-md transition
              ${styleUrl === STYLE_NORMAL
                                ? "bg-blue-600 text-white"
                                : "bg-white/90 text-gray-700 hover:bg-white"
                            }`}
                        title="Bản đồ mặc định"
                    >
                        Normal
                    </button>

                    <button
                        onClick={() => setStyleUrl(STYLE_SATELLITE)}
                        className={`rounded-lg px-4 py-2 text-sm shadow-md transition
              ${styleUrl === STYLE_SATELLITE
                                ? "bg-blue-600 text-white"
                                : "bg-white/90 text-gray-700 hover:bg-white"
                            }`}
                        title="Vệ tinh"
                    >
                        Satellite
                    </button>
                </div>
            </div>
        </div>
    );
}
