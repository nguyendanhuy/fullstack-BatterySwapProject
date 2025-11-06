package BatterySwapStation.repository;

import BatterySwapStation.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Map;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Integer> {
    @Query("""
SELECT new map(
    p.id AS planId,
    p.planName AS planName,
    p.description AS description,
    p.durationInDays AS durationInDays,
    p.swapLimit AS swapLimit,
    p.priceType AS priceType
)
FROM SubscriptionPlan p
ORDER BY p.id ASC
""")
    List<Map<String, Object>> findAllSimplePlans();




}
