package BatterySwapStation.utils;

public class QrTokenUtil {

    private static final String PREFIX = "BK";
    private static final long OFFSET = 7231L; // số bù, giữ cố định để decode ngược được
    private static final String BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // Convert số sang Base62
    public static String encodeBase62(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            int remainder = (int) (num % 62);
            sb.append(BASE62.charAt(remainder));
            num /= 62;
        }
        return sb.reverse().toString();
    }

    // Convert Base62 sang số
    public static long decodeBase62(String base62) {
        long result = 0;
        for (char c : base62.toCharArray()) {
            result = result * 62 + BASE62.indexOf(c);
        }
        return result;
    }

    // Sinh token từ bookingId
    public static String generateToken(long bookingId) {
        long encodedValue = bookingId + OFFSET;
        return PREFIX + encodeBase62(encodedValue);
    }

    // Giải mã token để lấy bookingId
    public static long extractBookingId(String token) {
        if (token == null || !token.startsWith(PREFIX)) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }
        String encodedPart = token.substring(PREFIX.length());
        long decodedValue = decodeBase62(encodedPart);
        return decodedValue - OFFSET;
    }
}
