package BatterySwapStation.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.naming.AuthenticationException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Gửi nhiều lỗi validate cùng lúc
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> messages = new HashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            messages.put(err.getField(), err.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("messages", messages);
        body.put("error", "Validation failed");
        body.put("status", 400);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Business logic error (email tồn tại, confirmPassword sai, role không tồn tại)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("messages", Map.of("business", ex.getMessage()));
        body.put("error", "Business error");
        body.put("status", 400);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Xử lý RuntimeException (vd: login sai mật khẩu, email không tồn tại)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("messages", Map.of("auth", ex.getMessage()));
        body.put("error", "Authentication error");
        body.put("status", 401); // 401 Unauthorized thay vì 403
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex) {
        if (ex instanceof AuthenticationException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication error"));
        }
        // Với các lỗi khác (DB, Transaction, ...), trả đúng mã lỗi 500
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", ex.getClass().getSimpleName(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> handleDatabaseException(DataAccessException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "Database error",
                        "message", ex.getMostSpecificCause().getMessage()
                ));
    }


}
