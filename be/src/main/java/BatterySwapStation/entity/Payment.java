package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PaymentId")
    private Long paymentId;

    @Column(name = "Amount", nullable = false)
    private double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "PaymentMethod", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "PaymentStatus", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private CreditCardPayment creditCardInfo;

    // 🆕 --- Bổ sung cho VNPAY ---
    @Column(name = "Gateway", length = 50)
    private String gateway; // VNPAY, MOMO, PAYPAL,...

    @Column(name = "VnpTxnRef", length = 100, unique = true)
    private String vnpTxnRef;

    @Column(name = "VnpTransactionNo", length = 100)
    private String vnpTransactionNo;

    @Column(name = "VnpResponseCode", length = 10)
    private String vnpResponseCode;

    @Column(name = "VnpTransactionStatus", length = 10)
    private String vnpTransactionStatus;

    @Column(name = "VnpBankCode", length = 20)
    private String vnpBankCode;

    @Column(name = "VnpPayDate", length = 20)
    private String vnpPayDate;

    @Column(name = "ChecksumOk")
    private Boolean checksumOk;

    // NEW: link tới Invoice (mỗi payment theo hóa đơn)
    @ManyToOne(fetch = FetchType.LAZY)              // hoặc @OneToOne nếu bạn chắc 1-1
    @JoinColumn(name = "invoiceid", nullable = true)
    private Invoice invoice;

    public enum PaymentMethod {
        CREDIT_CARD,
        E_WALLET,
        QR_BANKING
    }

    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED
    }
}
