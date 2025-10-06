package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Station")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StationId")
    private Integer stationId;

    @Column(name = "StationName", nullable = false, length = 255)
    private String stationName;

    @Column(name = "Address", nullable = false, length = 255)
    private String address;

    @Column(name = "Latitude", nullable = false, precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(name = "Longitude", nullable = false, precision = 10, scale = 6)
    private BigDecimal longitude;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    // 1 Station có nhiều Dock
    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Dock> docks = new ArrayList<>();
}
