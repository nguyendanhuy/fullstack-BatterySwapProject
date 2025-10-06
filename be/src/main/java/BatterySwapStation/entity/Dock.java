package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Dock")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Dock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DockId")
    private Integer dockId;

    @Column(name = "DockName", nullable = false, length = 50)
    private String dockName;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    // N-1: Dock thuộc về Station
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId")
    @JsonBackReference
    private Station station;

    // 1 Dock có nhiều DockSlot
    @OneToMany(mappedBy = "dock", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DockSlot> dockSlots = new ArrayList<>();
}
