package BatterySwapStation.dto;

        import java.time.LocalDateTime;
        import java.util.List;

        public class InvoiceResponseDTO {
            private Long id;
            private LocalDateTime createdDate;
            private Double totalAmount;
            private Double pricePerSwap;
            private Integer numberOfSwaps;
            private List<BookingInfoDTO> bookings;
            private String invoiceType;
            private String paymentMethod;

            // ✅ Constructor mặc định (REQUIRED cho Jackson/JPA)
            public InvoiceResponseDTO() {}

            // ✅ Constructor cho JPQL Projection (không có paymentMethod)
            public InvoiceResponseDTO(Long id, LocalDateTime createdDate, Double totalAmount,
                                      Double pricePerSwap, Integer numberOfSwaps,
                                      String invoiceType) {
                this.id = id;
                this.createdDate = createdDate;
                this.totalAmount = totalAmount;
                this.pricePerSwap = pricePerSwap;
                this.numberOfSwaps = numberOfSwaps;
                this.invoiceType = invoiceType;
                this.bookings = null;
            }

            // --- Getters and Setters ---
            public Long getId() { return id; }
            public void setId(Long id) { this.id = id; }

            public LocalDateTime getCreatedDate() { return createdDate; }
            public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

            public Double getTotalAmount() { return totalAmount; }
            public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

            public Double getPricePerSwap() { return pricePerSwap; }
            public void setPricePerSwap(Double pricePerSwap) { this.pricePerSwap = pricePerSwap; }

            public Integer getNumberOfSwaps() { return numberOfSwaps; }
            public void setNumberOfSwaps(Integer numberOfSwaps) { this.numberOfSwaps = numberOfSwaps; }

            public List<BookingInfoDTO> getBookings() { return bookings; }
            public void setBookings(List<BookingInfoDTO> bookings) { this.bookings = bookings; }

            public String getInvoiceType() { return invoiceType; }
            public void setInvoiceType(String invoiceType) { this.invoiceType = invoiceType; }

            public String getPaymentMethod() { return paymentMethod; }
            public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        }