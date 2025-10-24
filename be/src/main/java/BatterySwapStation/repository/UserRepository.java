package BatterySwapStation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import BatterySwapStation.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole_RoleId(int roleId);

    boolean existsByPhone(String phone);

}