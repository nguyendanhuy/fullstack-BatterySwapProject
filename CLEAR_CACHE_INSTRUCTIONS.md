# 🔄 HƯỚNG DẪN XÓA CACHE ĐỂ HIỂN THỊ batteryCount & batteryType

## ✅ Vấn đề đã được sửa ở Backend

Backend đã được sửa trong `Booking.java`:
```java
@Column(name = "batterycount")  // ✅ Đã sửa từ "BatteryCount" thành "batterycount"
private Integer batteryCount;
```

## 🌐 Frontend cần clear cache để thấy thay đổi

### Cách 1: Hard Refresh Browser (NHANH NHẤT)

**Windows/Linux:**
- Chrome/Edge: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- Firefox: `Ctrl + Shift + R`

**Mac:**
- Chrome/Edge/Safari: `Cmd + Shift + R`

### Cách 2: Clear Cache qua DevTools

1. Mở DevTools: `F12`
2. Chọn tab **Network**
3. Tick ✅ **Disable cache**
4. Reload trang: `F5`

### Cách 3: Clear Browser Cache hoàn toàn

**Chrome/Edge:**
1. `Ctrl + Shift + Delete`
2. Chọn "Cached images and files"
3. Click "Clear data"

### Cách 4: Incognito/Private Mode

1. Mở cửa sổ ẩn danh: `Ctrl + Shift + N` (Chrome/Edge) hoặc `Ctrl + Shift + P` (Firefox)
2. Truy cập `http://localhost:5173`

## 🧪 Kiểm tra sau khi clear cache

### 1. Xem API Response trong DevTools

1. Mở DevTools: `F12`
2. Tab **Network**
3. Reload trang
4. Tìm request `/bookings/user/{userId}`
5. Click vào request → Tab **Response**
6. Xác nhận có `batteryCount` và `batteryType`:

```json
{
  "batteryCount": 2,
  "batteryType": "LITHIUM_ION"
}
```

### 2. Kiểm tra Console

Mở Console (F12 → Console) và xem log:
```
✅Fetched booking history: [...]
```

Expand array và xác nhận mỗi booking có `batteryCount` và `batteryType`.

## 🔧 Nếu vẫn chưa hiển thị

### Restart cả Backend và Frontend

**Terminal 1 - Backend:**
```bash
cd d:\Code\GitHub\SWP391\fullstack-BatterySwapProject\be
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd d:\Code\GitHub\SWP391\fullstack-BatterySwapProject\fe
npm run dev
```

Sau đó mở Incognito mode và test lại.

## ✨ Kết quả mong đợi

Sau khi clear cache, bạn sẽ thấy:
- ✅ `batteryCount` hiển thị: `1`, `2`, etc.
- ✅ `batteryType` hiển thị: `LITHIUM_ION`
- ✅ Không còn `null` nữa!

---

**Lưu ý:** Vấn đề này chỉ xảy ra với **dữ liệu cũ** đã được frontend cache. Tất cả **booking mới** sẽ hiển thị đúng ngay lập tức!
