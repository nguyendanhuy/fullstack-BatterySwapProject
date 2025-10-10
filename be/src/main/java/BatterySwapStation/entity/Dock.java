package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "Dock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"station", "dockSlots"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Dock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DockId")
    @EqualsAndHashCode.Include
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
    private Set<DockSlot> dockSlots = new HashSet<>();
}
