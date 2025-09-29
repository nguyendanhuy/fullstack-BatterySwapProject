package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @Column(name = "UserId", length = 20)
    private String userId;

    @Column(name = "FullName", nullable = false, length = 255)
    private String fullName;

    @Column(name = "Password", nullable = false, length = 255)
    private String password;

    @Column(name = "Email", nullable = false, length = 255, unique = true)
    private String email;

    @Column(name = "Phone", length = 50)
    private String phone;

    @Column(name = "Address", nullable = false, length = 255)
    private String address;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive;

    @CreationTimestamp
    @Column(name = "CreateAt", nullable = false)
    private LocalDateTime createAt;

    @UpdateTimestamp
    @Column(name = "UpdateAt", nullable = false)
    private LocalDateTime updateAt;

    // N-1: User thuộc về 1 Role
    @ManyToOne
    @JoinColumn(name = "RoleId", nullable = false)
    private Role role;

    // 1 User có nhiều StaffAssign
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StaffAssign> staffAssigns = new ArrayList<>();
}
