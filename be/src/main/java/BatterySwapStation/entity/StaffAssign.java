package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "StaffAssign")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffAssign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AssignId", nullable = false)
    private int assignId;

    @Column(name = "StationId", nullable = false)
    private int stationId;

    @Column(name = "AssignDate", nullable = false)
    private LocalDateTime assignDate;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive;

    // N-1: nhiều StaffAssign thuộc về 1 User
    @ManyToOne
    @JoinColumn(name = "UserId", nullable = false)
    private User user;
}
