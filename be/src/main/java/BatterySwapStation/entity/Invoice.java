package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "Invoice")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "invoice_seq")
    @SequenceGenerator(
            name = "invoice_seq",
            sequenceName = "invoice_sequence",
            initialValue = 10000,
            allocationSize = 1
    )
    @Column(name = "invoiceid")
    private Long invoiceId;

    @Column(name = "userid")
    private String userId;

    @Column(name = "createddate")
    private LocalDateTime createdDate;

    @Column(name = "totalamount")
    private Double totalAmount;

    @Column(name = "priceperswap")
    private Double pricePerSwap;

    @Column(name = "numberofswaps")
    private Integer numberOfSwaps = 0;

    public enum InvoiceStatus {
        PENDING,
        PAID,
        PAYMENTFAILED,
    }

    public enum InvoiceType {
        BOOKING,
        SUBSCRIPTION,
        WALLET_TOPUP
    }

    // 🆕 Thêm sau phần enum InvoiceType
    @Enumerated(EnumType.STRING)
    @Column(name = "invoicetype", length = 30)
    private InvoiceType invoiceType = InvoiceType.BOOKING;

    // Getter / Setter cho InvoiceType
    public InvoiceType getInvoiceType() {
        return invoiceType;
    }

    public void setInvoiceType(InvoiceType invoiceType) {
        this.invoiceType = invoiceType;
    }


    @Enumerated(EnumType.STRING)
    @Column(name = "invoicestatus", nullable = false, length = 20)
    private InvoiceStatus invoiceStatus = InvoiceStatus.PENDING;

    @OneToMany(mappedBy = "invoice")
    @JsonIgnore
    private List<Booking> bookings;

    /**
     * ✅ [THÊM MỚI] Liên kết @OneToMany đến Payment
     * Một Invoice có thể có NHIỀU lần thanh toán (thất bại, thành công...)
     */
    @OneToMany(mappedBy = "invoice", fetch = FetchType.LAZY)
    @JsonIgnore // Dùng JsonIgnore để tránh lỗi vòng lặp (loop)
    private List<Payment> payments;

    /**
     * [MỚI] Dùng để liên kết invoice này với một GÓI CƯỚỚC.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planidtoactivate")
    private SubscriptionPlan planToActivate;

    // Getters and setters
    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    @JsonIgnore
    public Long getId() {
        return invoiceId;
    }

    @JsonIgnore
    public void setId(Long id) {
        this.invoiceId = id;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Double getPricePerSwap() {
        return pricePerSwap;
    }

    public void setPricePerSwap(Double pricePerSwap) {
        this.pricePerSwap = pricePerSwap;
    }

    public Integer getNumberOfSwaps() {
        return numberOfSwaps;
    }

    public void setNumberOfSwaps(Integer numberOfSwaps) {
        this.numberOfSwaps = numberOfSwaps;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }

    /**
     * ✅ [THÊM MỚI] Getters and setters cho 'payments'
     */
    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    // (Getters/Setters cho các trường cũ)
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public InvoiceStatus getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(InvoiceStatus invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public SubscriptionPlan getPlanToActivate() {
        return planToActivate;
    }

    public void setPlanToActivate(SubscriptionPlan planToActivate) {
        this.planToActivate = planToActivate;
    }

    public void calculateTotalAmount() {
        int totalBookings = 0;
        double totalSum = 0.0;

        if (this.bookings != null && !this.bookings.isEmpty()) {
            for (Booking booking : this.bookings) {
                if (booking != null) {
                    totalBookings++;
                    if (booking.getAmount() != null) {
                        totalSum += booking.getAmount();
                    }
                }
            }
        }
        this.numberOfSwaps = totalBookings;
        this.totalAmount = totalSum;
    }
}