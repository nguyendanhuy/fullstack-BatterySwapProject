package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CreditCardPayment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCardPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CardPaymentId")
    private Long cardPaymentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PaymentId", nullable = false)
    private Payment payment;

    @Column(name = "CardNumber", nullable = false, length = 20)
    private String cardNumber;

    @Column(name = "CardHolderName", nullable = false, length = 100)
    private String cardHolderName;

    @Column(name = "ExpiryDate", nullable = false, length = 5) // MM/YY
    private String expiryDate;

    @Column(name = "CVV", nullable = false, length = 4)
    private String cvv;
}
