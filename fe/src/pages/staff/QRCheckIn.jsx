
import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QrCode, CheckCircle, User, Zap, Star, Smartphone, Box, AlertCircle, Battery, Barcode, Bike, Loader2, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Divider, Space, Upload, Popconfirm } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ReaderException } from "@zxing/library";
import { BrowserQRCodeReader } from "@zxing/browser";
import { checkBatteryModule, commitSwap, verifyQrBooking, cancelBooking, createInspectionAndDispute } from "../../services/axios.services";
import dayjs from "dayjs";
import { SystemContext } from "../../contexts/system.context";
const QRCheckIn = () => {
  const { toast } = useToast();
  const { userData } = useContext(SystemContext);
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [batterySlotNumber, setBatterySlotNumber] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [enteredBatteryId, setEnteredBatteryId] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [qrData, setQrData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isService, setIsService] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    batteryInId: "",
    stateOfHealth: 0,
    physicalNotes: "",
    createDispute: false,
    disputeTitle: "",
    disputeDescription: ""
  });
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  // revoke URL khi unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [previewUrl]);

  // const mockCustomer = {
  //   name: "Nguyễn Văn A",
  //   phone: "0123456789",
  //   vehicle: "VF 8 Plus",
  //   batteryType: "Lithium-ion",
  //   paymentStatus: "Đã thanh toán",
  //   reservationTime: "14:30 - 15/12/2024",
  //   qrCode: "QR123456789",
  //   expectedBatteryId: "BAT001"
  // };
  //hàm format đầu vào của batteryId
  const formatBatteryIdInput = (input) => {
    return (input ?? "").split(/[,\n\r\t ]+/).map(id => id.trim()).filter(Boolean).map(id => id.toUpperCase());
  }
  //Tìm mã ko hợp lệ
  const validateBatteryIds = (ids) => {
    if (ids.length === 0) return "Vui lòng nhập ít nhất 1 mã pin.";
    const invalid = ids.find(id => !/^[A-Z0-9]{1,50}$/.test(id));
    return invalid ? `Mã pin không hợp lệ: ${invalid}` : "";
  };

  //hàm xác thực pin
  const handleBatteryVerify = async () => {
    if (!enteredBatteryId.trim()) {
      setVerificationError("Vui lòng nhập ID pin");
      return;
    }
    const ids = formatBatteryIdInput(enteredBatteryId);
    const validationError = validateBatteryIds(ids);
    if (validationError) {
      setVerificationError(validationError);
      return;
    }
    setVerificationError("");
    const data = {
      bookingId: scannedCustomer.bookingId,
      batteryIds: ids,
    }
    setIsVerifying(true);
    try {
      const res = await checkBatteryModule(data);
      if (res.success) {
        toast({
          title: "Xác thực pin thành công",
          description: res.message,
          duration: 5000,
        });
      } else {
        setVerificationError(res.message || "Xác thực pin thất bại");
      }
    } catch (err) {
      toast({
        title: "Lỗi mạng khi xác thực pin",
        description: "Lỗi xác thực pin. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }
  //hàm bắt đầu dịch vụ
  const startService = async () => {
    if (!enteredBatteryId.trim()) {
      setVerificationError("Vui lòng nhập ID pin");
      return;
    }
    const ids = formatBatteryIdInput(enteredBatteryId);
    const validationError = validateBatteryIds(ids);
    if (validationError) {
      setVerificationError(validationError);
      return;
    }
    setVerificationError("");
    const data = {
      bookingId: scannedCustomer.bookingId,
      batteryInIds: ids,
      staffUserId: userData.userId
    }
    console.log("Starting service with data:", data);
    //gọi api commitSwap
    setIsService(true)
    try {
      const res = await commitSwap(data);
      if (res.success) {
        toast({
          title: "Hoàn thành đổi pin",
          description: res.message,
          duration: 5000,
        });
        const slotNumber = res.data.map(item => item.dockOutSlot);
        setBatterySlotNumber(slotNumber);
        console.log("Swap committed:", res);
        setVerificationError("");
        setIsDialogOpen(true);
        toast({
          title: "Dịch vụ đã bắt đầu",
          description: `Ô pin đang mở....`,
        });
      } else {
        setVerificationError(res.message || "Xác thực pin thất bại");
      }
    } catch (err) {
      toast({
        title: "Lỗi mạng khi tải QR Code",
        description: "Lỗi mạng",
        variant: "destructive",
      });
    } finally {
      setIsService(false);
    }
  };

  //hàm hủy booking

  const handleCancelBooking = async () => {
    if (!scannedCustomer?.bookingId) {
      toast({
        title: "Không tìm thấy booking",
        description: "Vui lòng quét QR hợp lệ trước khi hủy.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);
    try {
      // payload có thể thay đổi tùy API của bạn
      const res = await cancelBooking({
        bookingId: scannedCustomer.bookingId,
        cancelType: "PERMANENT"
      });

      if (res?.success) {
        toast({
          title: "Đã hủy đặt lịch",
          description: res.message || "Hủy booking thành công.",
          duration: 5000,
        });
        // Tuỳ UX: có thể clear khách hàng đã quét
        setScannedCustomer(null);
        setEnteredBatteryId("");
        setVerificationError("");
      } else {
        toast({
          title: "Hủy thất bại",
          description: res?.message || "Không thể hủy booking.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi mạng khi hủy booking",
        description: err?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle battery inspection form
  const handleInspectionSubmit = async () => {
    if (!scannedCustomer?.bookingId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy booking ID",
        variant: "destructive",
      });
      return;
    }

    if (!inspectionData.batteryInId.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập ID pin trả về",
        variant: "destructive",
      });
      return;
    }

    if (inspectionData.stateOfHealth < 0 || inspectionData.stateOfHealth > 100) {
      toast({
        title: "Lỗi",
        description: "State of Health phải từ 0-100",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingInspection(true);
    try {
      const payload = {
        batteryInId: inspectionData.batteryInId.trim(),
        bookingId: scannedCustomer.bookingId,
        stateOfHealth: inspectionData.stateOfHealth,
        physicalNotes: inspectionData.physicalNotes.trim(),
        createDispute: inspectionData.createDispute,
        disputeTitle: inspectionData.createDispute ? inspectionData.disputeTitle.trim() : "",
        disputeDescription: inspectionData.createDispute ? inspectionData.disputeDescription.trim() : "",
        staffId: userData.userId
      };

      const res = await createInspectionAndDispute(payload);
      console.log("Inspection submission response:", res);

      if (res?.success) {
        toast({
          title: "Thành công",
          description: res.message || "Đã lưu thông tin kiểm tra pin",
          duration: 5000,
        });
        setIsInspectionDialogOpen(false);
        // Reset form
        setInspectionData({
          batteryInId: "",
          stateOfHealth: 0,
          physicalNotes: "",
          createDispute: false,
          disputeTitle: "",
          disputeDescription: ""
        });
      } else {
        toast({
          title: "Thất bại",
          description: res?.message || "Không thể lưu thông tin kiểm tra",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err?.message || "Đã xảy ra lỗi khi lưu thông tin",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await verifyQrBooking(qrData);
      console.log("QR scan response:", res);
      if (res) {
        setScannedCustomer(res.data);
        toast({
          title: "Đọc QR thành công",
          description: res.message,
          duration: 5000,
        });
      } else if (res?.error) {
        toast({
          title: "Lỗi đọc QR Code",
          description: JSON.stringify(res.message),
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi mạng khi đọc QR Code",
        description: err?.message || "Lỗi mạng",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  //hàm xử lý quét QR 
  const onPickFile = async (file) => {
    setError("");
    if (!file) return;

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return prev;
    });

    const reader = new BrowserQRCodeReader();
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);
    try {
      const res = await reader.decodeFromImageUrl(url);
      setQrData(res.getText());
    } catch (err) {
      console.error(err);
      setError("Không phát hiện QR trong ảnh. Hãy chọn ảnh rõ/crop sát QR.");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">Quét QR thông minh</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Scanner */}
          <div>
            {/* QR Scanner (clean vertical layout) */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in rounded-3xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-gray-900">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                    <span>Quét QR Code khách hàng</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-center text-gray-600 text-base">
                  Quét mã QR của khách hàng để xác nhận đặt lịch và bắt đầu dịch vụ
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                {/* Khung hiển thị QR */}
                <div
                  className={`relative mx-auto w-80 h-80 rounded-2xl overflow-hidden transition-all duration-500
                  ${isScanning
                      ? "ring-4 ring-blue-500 bg-blue-50 shadow-lg"
                      : "ring-4 ring-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
                    }`}
                >
                  {/* Ảnh QR nếu có */}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="QR preview"
                      className={`w-full h-full object-contain transition-all duration-500
                      ${isScanning ? "opacity-40 blur-[1px]" : "opacity-100"}`}
                    />
                  )}

                  {/* Nút xóa ảnh chỉ hiện khi có preview và không đang quét */}
                  {previewUrl && !isScanning && (
                    <div className="absolute top-3 right-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white rounded-lg"
                        onClick={() => {
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          setError("");
                        }}
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  )}

                  {/* Overlay hiển thị khi đang quét */}
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[2px]">
                      <div className="animate-spin mb-4">
                        <QrCode className="h-20 w-20 text-blue-600" />
                      </div>
                      <p className="text-blue-600 font-semibold">Đang quét...</p>
                    </div>
                  )}

                  {/* Nếu không có ảnh và không đang quét → placeholder */}
                  {!previewUrl && !isScanning && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <QrCode className="h-20 w-20 text-blue-600 mb-3" />
                      <p className="text-gray-600 font-medium">Sẵn sàng quét QR Code</p>
                    </div>
                  )}

                  {/* Hiển thị lỗi nếu có */}
                  {error && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg ring-1 ring-red-200 max-w-[85%]">
                      {error}
                    </div>
                  )}
                </div>
                <Space direction="vertical" className="w-full items-center">
                  <Upload
                    disabled={isScanning}
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith("image/");
                      if (!isImage) {
                        toast({
                          title: "Tệp không hợp lệ",
                          description: "Vui lòng chọn một hình ảnh (jpg, png, webp...)",
                          variant: "destructive",
                        });
                        return Upload.LIST_IGNORE;
                      }
                      onPickFile(file);
                      return false;
                    }}
                  >
                    <Button
                      disabled={isScanning}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg min-w-[250px]"
                      icon={<UploadOutlined />}
                    >
                      Upload QR
                    </Button>
                  </Upload>

                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg min-w-[250px]"
                  >
                    {isScanning ? (
                      <>
                        <div className="animate-spin mr-2">
                          <QrCode className="h-5 w-5" />
                        </div>
                        Đang quét...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Bắt đầu quét QR
                      </>
                    )}
                  </Button>
                </Space>

                {/* Gợi ý nhỏ */}
                <p className="text-xs text-gray-500">
                  Hỗ trợ JPG, PNG, WEBP. Ảnh rõ, crop sát QR sẽ cho kết quả tốt hơn.
                </p>
              </CardContent>
            </Card>


            {/* Instructions */}
            <Card className="mt-6 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Smartphone className="h-6 w-6 mr-2" />
                  Hướng dẫn sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Yêu cầu khách hàng mở ứng dụng",
                  "Khách hàng hiển thị QR code đặt lịch",
                  "Nhấn 'Bắt đầu quét QR' để kích hoạt",
                  "Đưa camera về phía QR code",
                  "Hệ thống sẽ tự động xác nhận"
                ].map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div>
            {scannedCustomer ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-scale-in">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    Check-in thành công!
                  </CardTitle>
                  <CardDescription className="text-gray-600">Thông tin khách hàng đã được xác nhận</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { icon: User, label: "Tên khách hàng", value: scannedCustomer.fullName, color: "from-blue-500 to-indigo-500" },
                      { icon: Smartphone, label: "Số điện thoại", value: scannedCustomer.phone, color: "from-green-500 to-emerald-500" },
                      { icon: QrCode, label: "Loại xe", value: scannedCustomer.vehicleType, color: "from-purple-500 to-pink-500" },
                      { icon: Zap, label: "Loại pin", value: scannedCustomer.batteryType, color: "from-orange-500 to-yellow-500" },
                      { icon: Bike, label: "Mã vin", value: scannedCustomer.vehicleVin, color: "from-red-500 to-yellow-500" },
                      { icon: Battery, label: "Số lượng pin", value: scannedCustomer.batteryCount, color: "from-blue-500 to-green-500" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className={`p-3 bg-gradient-to-r ${item.color} rounded-xl`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-gray-600 block">{item.label}</label>
                          <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <label className="text-sm font-semibold text-blue-700 block mb-1">Thời gian hẹn</label>
                      <p className="font-semibold text-blue-800">
                        {dayjs(`${scannedCustomer.bookingDate} ${scannedCustomer.timeSlot}`).format("HH:mm, DD/MM/YYYY")}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 flex items-center">
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-1">Trạng thái thanh toán</label>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {scannedCustomer.invoiceStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Battery ID Verification Section */}
                  <div className="pt-6 border-t border-gray-200">

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="battery-id" className="text-sm font-semibold text-gray-700">
                        Nhập ID pin để xác thực
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="battery-id"
                          type="text"
                          placeholder="Nhập ID pin (VD: BAT001)"
                          value={enteredBatteryId}
                          onChange={(e) => {
                            setEnteredBatteryId(e.target.value);
                            setVerificationError("");
                          }}
                          className={`text-lg font-semibold flex-1 ${verificationError
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                            }`}
                        />

                        <Button
                          onClick={handleBatteryVerify}
                          variant="outline"
                          disabled={isVerifying || !enteredBatteryId.trim()}
                          className="relative rounded-xl px-6 font-semibold text-blue-700 border-blue-500 hover:bg-blue-50 disabled:opacity-60"
                        >
                          <span className={isVerifying ? "opacity-0" : "opacity-100 flex items-center"}>
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                            Xác nhận
                          </span>
                          {isVerifying && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          )}
                        </Button>
                      </div>

                      {verificationError && (
                        <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
                          <AlertCircle className="h-4 w-4" />
                          <span>{verificationError}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={startService}
                      disabled={!enteredBatteryId.trim() || isVerifying || isService}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Nội dung nút ẩn khi loading */}
                      <span className={isService ? "opacity-0" : "opacity-100 flex items-center"}>
                        <Star className="h-5 w-5 mr-2" />
                        Bắt đầu dịch vụ đổi pin
                      </span>

                      {isService && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}
                    </Button>

                    {/* Nút hủy booking */}
                    <div className="mt-3">
                      <Popconfirm
                        title="Hủy đặt lịch?"
                        description="Bạn có chắc muốn hủy booking này?"
                        okText="Hủy lịch"
                        cancelText="Không"
                        onConfirm={handleCancelBooking}
                        okButtonProps={{ loading: isCancelling }}
                        disabled={!scannedCustomer}
                      >
                        <Button
                          variant="destructive"
                          disabled={!scannedCustomer || isCancelling || isService || isVerifying}
                          className="w-full rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCancelling ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Đang hủy đặt lịch...
                            </span>
                          ) : (
                            "Hủy booking"
                          )}
                        </Button>
                      </Popconfirm>
                    </div>

                    {/* Nút nhập trạng thái pin trả về */}
                    <div className="mt-3">
                      <Button
                        onClick={() => setIsInspectionDialogOpen(true)}
                        disabled={!scannedCustomer}
                        variant="outline"
                        className="w-full rounded-xl py-3 font-semibold border-2 border-blue-500 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ClipboardCheck className="h-5 w-5 mr-2" />
                        Nhập trạng thái pin trả về
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <QrCode className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-3">Chờ quét QR Code</h3>
                  <p className="text-gray-500">Thông tin khách hàng sẽ hiển thị sau khi quét thành công</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Battery Inspection Dialog */}
      <Dialog open={isInspectionDialogOpen} onOpenChange={setIsInspectionDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              Nhập trạng thái pin trả về
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin kiểm tra pin được trả lại từ khách hàng (Booking ID: {scannedCustomer?.bookingId})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Battery In ID */}
            <div className="space-y-2">
              <Label htmlFor="batteryInId" className="text-sm font-semibold">
                ID Pin trả về <span className="text-red-500">*</span>
              </Label>
              <Input
                id="batteryInId"
                placeholder="Nhập ID pin (VD: BAT001)"
                value={inspectionData.batteryInId}
                onChange={(e) => setInspectionData({ ...inspectionData, batteryInId: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* State of Health */}
            <div className="space-y-2">
              <Label htmlFor="stateOfHealth" className="text-sm font-semibold">
                Tình trạng sức khỏe pin (SOH %) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stateOfHealth"
                type="number"
                min="0"
                max="100"
                placeholder="Nhập 0-100"
                value={inspectionData.stateOfHealth}
                onChange={(e) => setInspectionData({ ...inspectionData, stateOfHealth: parseInt(e.target.value) || 0 })}
                className="text-lg"
              />
            </div>

            {/* Physical Notes */}
            <div className="space-y-2">
              <Label htmlFor="physicalNotes" className="text-sm font-semibold">
                Ghi chú về tình trạng vật lý
              </Label>
              <Textarea
                id="physicalNotes"
                placeholder="VD: Pin có vết trầy xước nhẹ ở góc..."
                value={inspectionData.physicalNotes}
                onChange={(e) => setInspectionData({ ...inspectionData, physicalNotes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Create Dispute Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="space-y-0.5">
                <Label htmlFor="createDispute" className="text-sm font-semibold">
                  Tạo tranh chấp
                </Label>
                <p className="text-xs text-gray-600">
                  Bật nếu pin có vấn đề cần báo cáo
                </p>
              </div>
              <Switch
                id="createDispute"
                checked={inspectionData.createDispute}
                onCheckedChange={(checked) => setInspectionData({ ...inspectionData, createDispute: checked })}
              />
            </div>

            {/* Dispute Fields - Only show if createDispute is true */}
            {inspectionData.createDispute && (
              <div className="space-y-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                <div className="space-y-2">
                  <Label htmlFor="disputeTitle" className="text-sm font-semibold text-orange-800">
                    Tiêu đề tranh chấp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="disputeTitle"
                    placeholder="VD: Pin bị hư hỏng nghiêm trọng"
                    value={inspectionData.disputeTitle}
                    onChange={(e) => setInspectionData({ ...inspectionData, disputeTitle: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disputeDescription" className="text-sm font-semibold text-orange-800">
                    Mô tả tranh chấp <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="disputeDescription"
                    placeholder="Mô tả chi tiết vấn đề..."
                    value={inspectionData.disputeDescription}
                    onChange={(e) => setInspectionData({ ...inspectionData, disputeDescription: e.target.value })}
                    rows={3}
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsInspectionDialogOpen(false);
                setInspectionData({
                  batteryInId: "",
                  stateOfHealth: 0,
                  physicalNotes: "",
                  createDispute: false,
                  disputeTitle: "",
                  disputeDescription: ""
                });
              }}
              className="flex-1"
              disabled={isSubmittingInspection}
            >
              Hủy
            </Button>
            <Button
              onClick={handleInspectionSubmit}
              disabled={isSubmittingInspection}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmittingInspection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Lưu thông tin
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Battery Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse">
                <Box className="h-12 w-12 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Ô pin đang mở</DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              Pin đang được mở ở {batterySlotNumber.length} ô số
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            {batterySlotNumber.map((number, index) => (
              <div key={index} className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce mx-2">
                <span className="text-6xl font-bold text-white">{number}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setIsDialogOpen(false);
                setScannedCustomer(null);
                setEnteredBatteryId("");
                setVerificationError("");
                setPreviewUrl(null);
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
            >
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCheckIn;
