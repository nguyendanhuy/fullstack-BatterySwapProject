package BatterySwapStation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import BatterySwapStation.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Role findByRoleName(String roleName);
    Role findByRoleId(int roleId);
    boolean existsByRoleName(String roleName);
}
