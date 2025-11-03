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

    // 🆕 Thêm loại giao dịch: PAYMENT hoặc REFUND
    @Enumerated(EnumType.STRING)
    @Column(name = "TransactionType", nullable = false, length = 20)
    private TransactionType transactionType = TransactionType.PAYMENT;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private CreditCardPayment creditCardInfo;

    @Column(name = "Message")
    private String message;

    // 🆕 --- Bổ sung cho VNPAY / Refund ---
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

    // Liên kết tới Invoice (1 invoice có thể có nhiều payment, ví dụ payment + refund)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceId", nullable = true)
    private Invoice invoice;

    // ===================== ENUMS =====================

    public enum PaymentMethod {
        SUBSCRIPTION,
        WALLET,
        VNPAY,
        CASH
    }

    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED
    }

    public enum TransactionType {
        PAYMENT,
        REFUND
    }
    public enum PaymentChannel {
        WALLET,
        VNPAY,
        CASH,
        NONE // Khi không thu tiền hoặc refund
    }

    @Column(name = "penalty_level")
    @Enumerated(EnumType.STRING)
    private DisputeTicket.PenaltyLevel penaltyLevel;

    @Column(name = "penalty_amount")
    private Double penaltyAmount;

    @Column(name = "payment_channel")
    @Enumerated(EnumType.STRING)
    private PaymentChannel paymentChannel;

}
