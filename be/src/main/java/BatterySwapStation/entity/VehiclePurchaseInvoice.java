package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "VehiclePurchaseInvoice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehiclePurchaseInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InvoiceId")
    private Long invoiceId;

    @Column(name = "VIN", length = 100, nullable = false, unique = true, insertable = false, updatable = false)
    private String VIN;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VIN", referencedColumnName = "VIN")
    @JsonBackReference
    private Vehicle vehicle;

    @Column(name = "InvoiceNumber", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "BuyerName", nullable = false, length = 255)
    private String buyerName;

    @Column(name = "BuyerEmail", nullable = false, length = 255)
    private String buyerEmail;

    @Column(name = "BuyerPhone", nullable = false, length = 50)
    private String buyerPhone;

    @Column(name = "IsVerified", nullable = false)
    private boolean isVerified = false;
}
