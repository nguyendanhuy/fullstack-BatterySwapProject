package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Role")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoleId", nullable = false)
    private int roleId;

    @Column(name = "RoleName", nullable = false, unique = true, length = 255)
    private String roleName;

    // 1 Role có nhiều User
    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> users = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void prepareRoleName() {
        if (this.roleName != null) {
            this.roleName = this.roleName.toUpperCase();
        }
    }

    public String getRoleName() {
        return roleName != null ? roleName.toUpperCase() : null;
    }
}
