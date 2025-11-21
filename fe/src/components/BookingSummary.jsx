// BookingSummary.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Car, Battery } from "lucide-react";

export default function BookingSummary({ selectBattery, totalQuota, totalBooked, onRemove }) {
    const items = Object.values(selectBattery || {});

    return (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Tóm tắt đặt pin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                    Đã chọn: <b>{totalBooked}</b> / {totalQuota} pin
                </div>

                {items.length === 0 ? (
                    <div className="text-sm text-gray-500">Chưa có xe nào được gán pin.</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((it) => (
                            <div key={it.vehicleInfo.vehicleId} className="flex items-start justify-between p-3 rounded-lg border">
                                <div className="text-sm">
                                    <div className="font-semibold">🛵 {it.vehicleInfo.vehicleType} — 🔋 {it.batteryType}</div>
                                    {it.stationInfo ? (
                                        <>
                                            <div>Trạm: {it.stationInfo.stationName}</div>
                                            <div className="text-gray-600">Số lượng: <b>{it.qty}</b></div>
                                        </>
                                    ) : (
                                        <div className="text-gray-500">Chưa chọn trạm</div>
                                    )}
                                </div>
                                <Button variant="outline" onClick={() => onRemove(it.vehicleInfo.vehicleId)} className="border-2">
                                    Xoá
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Link
                    to="/driver/reservation"
                    className={`${items.length === 0 || totalBooked === 0 ? "pointer-events-none opacity-50" : ""}`}
                    state={{ selectBattery }}  // <-- đem sang trang booking
                >
                    <Button className="w-full mt-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Tiến hành booking
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
