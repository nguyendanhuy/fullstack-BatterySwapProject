package BatterySwapStation.utils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.SneakyThrows;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
//build query + ký HMAC SHA512
public class VnPayUtils {

    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        // XFF có thể là "ip1, ip2", lấy ip đầu
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        return ip;
    }

    /** format yyyyMMddHHmmss theo GMT+7 */
    public static String formatDate(Calendar cal) {
        SimpleDateFormat df = new SimpleDateFormat("yyyyMMddHHmmss");
        df.setTimeZone(cal.getTimeZone());
        return df.format(cal.getTime());
    }

    /** Sắp xếp key ASC, encode value US_ASCII, nối bằng & để tạo chuỗi hash */
    /** Sắp xếp key ASC, encode value UTF-8, nối bằng & để tạo chuỗi hash */
    public static String buildDataToSign(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String k = fieldNames.get(i);
            String v = params.get(k);
            if (v != null && !v.isEmpty()) {
                sb.append(k).append('=')
                        .append(URLEncoder.encode(v, StandardCharsets.UTF_8));
                if (i < fieldNames.size() - 1) sb.append('&');
            }
        }
        return sb.toString();
    }


    @SneakyThrows
    public static String hmacSHA512(String key, String data) {
        Mac hmac = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac.init(secretKey);
        byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hash = new StringBuilder(bytes.length * 2);
        for (byte aByte : bytes) hash.append(String.format("%02x", aByte));
        return hash.toString();
    }

    /** Build query string (đã có vnp_SecureHash) để redirect sang VNPAY */
    public static String buildPaymentUrl(String basePayUrl, Map<String, String> params, String secret) {
        String dataToSign = buildDataToSign(params);
        String secureHash = hmacSHA512(secret, dataToSign);
        return basePayUrl + "?" + dataToSign + "&vnp_SecureHash=" + secureHash;
    }

    public static String getVnPayResponseMessage(String code) {
        if (code == null) code = "99"; // fallback khi sandbox không trả mã phản hồi
        return switch (code) {
            case "00" -> "Giao dịch thành công";
            case "07" -> "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).";
            case "09" -> "Thẻ/Tài khoản của khách hàng chưa đăng ký InternetBanking.";
            case "10" -> "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.";
            case "11" -> "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.";
            case "12" -> "Thẻ/Tài khoản của khách hàng bị khóa.";
            case "13" -> "Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).";
            case "24" -> "Khách hàng hủy giao dịch.";
            case "51" -> "Tài khoản không đủ số dư để thực hiện giao dịch.";
            case "65" -> "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.";
            case "75" -> "Ngân hàng thanh toán đang bảo trì.";
            case "79" -> "Nhập sai mật khẩu thanh toán quá số lần quy định.";
            case "99" -> "Lỗi không xác định (sandbox hoặc lỗi hệ thống).";
            default -> "Giao dịch không thành công. Mã lỗi: " + code;
        };
    }


    public static String getVnPayTransactionStatusMessage(String code) {
        return switch (code) {
            case "00" -> "Giao dịch thành công";
            case "01" -> "Giao dịch chưa hoàn tất";
            case "02" -> "Giao dịch bị lỗi";
            case "04" -> "Giao dịch đảo (bị trừ tiền nhưng chưa ghi nhận ở VNPAY)";
            case "05" -> "VNPAY đang xử lý giao dịch hoàn tiền";
            case "06" -> "VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng";
            case "07" -> "Giao dịch bị nghi ngờ gian lận";
            case "09" -> "Giao dịch hoàn trả bị từ chối";
            default -> "Trạng thái không xác định";
        };
    }
    public static String getRefundResponseMessage(String code) {
        if (code == null) return "Không xác định mã phản hồi";
        return switch (code) {
            case "00" -> "Hoàn tiền thành công";
            case "02" -> "Mã định danh kết nối không hợp lệ (TmnCode sai)";
            case "03" -> "Dữ liệu gửi sang không đúng định dạng (sai format hoặc thiếu tham số)";
            case "91" -> "Không tìm thấy giao dịch cần hoàn tiền";
            case "94" -> "Yêu cầu trùng lặp, VNPay đang xử lý";
            case "95" -> "Giao dịch gốc thất bại, không thể hoàn tiền";
            case "97" -> "Checksum không hợp lệ";
            case "99" -> "Lỗi khác hoặc lỗi hệ thống";
            default -> "Lỗi không xác định, mã: " + code;
        };
    }

}
