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
}
