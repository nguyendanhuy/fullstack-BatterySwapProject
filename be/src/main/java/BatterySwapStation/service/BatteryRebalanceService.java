package BatterySwapStation.service;

import BatterySwapStation.dto.RebalanceRequest;
import BatterySwapStation.dto.RebalanceSuggestion;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.BatteryRebalance;
import BatterySwapStation.entity.Station;
import BatterySwapStation.repository.BatteryRebalanceRepository;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.ojalgo.optimisation.Expression;
import org.ojalgo.optimisation.ExpressionsBasedModel;
import org.ojalgo.optimisation.Optimisation;
import org.ojalgo.optimisation.Variable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatteryRebalanceService {

    private final StationRepository stationRepository;
    private final BatteryRepository batteryRepository;
    private final BatteryRebalanceRepository rebalanceRepository;

    // ===================== CRUD LỆNH ĐIỀU PHỐI =====================

    public BatteryRebalance createRebalanceOrder(RebalanceRequest request) {
        Station from = stationRepository.findById(request.getFromStationId())
                .orElseThrow(() -> new RuntimeException("From station not found"));
        Station to = stationRepository.findById(request.getToStationId())
                .orElseThrow(() -> new RuntimeException("To station not found"));

        BatteryRebalance order = BatteryRebalance.builder()
                .fromStation(from)
                .toStation(to)
                .batteryType(request.getBatteryType())
                .quantity(request.getQuantity())
                .note(request.getNote())
                .status(BatteryRebalance.RebalanceStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return rebalanceRepository.save(order);
    }

    public BatteryRebalance updateStatus(Long id, BatteryRebalance.RebalanceStatus newStatus) {
        BatteryRebalance order = rebalanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rebalance order not found"));
        order.setStatus(newStatus);
        return rebalanceRepository.save(order);
    }

    public List<BatteryRebalance> getAllOrders() {
        return rebalanceRepository.findAll();
    }

    // ===================== AI GỢI Ý ĐIỀU PHỐI (LINEAR PROGRAMMING) =====================
    // Ý tưởng:
    //  - x[i][j]: số pin chuyển từ station i -> j (biến nguyên, >=0)
    //  - shortage[i]: thiếu hụt còn lại tại station i (>=0, phạt lớn trong objective)
    //  - Mục tiêu: Min( sum(cost[i][j] * x[i][j]) + SHORTAGE_PENALTY * sum(shortage[i]) )
    //  - Ràng buộc:
    //      + Không gửi quá số pin hiện có ở mỗi trạm
    //      + current - outbound + inbound + shortage >= target (cân bằng tồn kho tối thiểu)
    public List<RebalanceSuggestion> getAiSuggestions() {

        // 1. Lấy station đang active
        List<Station> stations = stationRepository.findAll().stream()
                .filter(Station::isActive)
                .collect(Collectors.toList());

        int n = stations.size();
        if (n <= 1) return Collections.emptyList();

        // 2. Đếm số pin active tại mỗi trạm
        Map<Integer, Long> currentMap = batteryRepository.findAll().stream()
                .filter(Battery::isActive)
                .filter(b -> b.getStationId() != null)
                .collect(Collectors.groupingBy(Battery::getStationId, Collectors.counting()));

        long total = currentMap.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        if (total == 0) return Collections.emptyList();

        // 3. Target tồn kho mỗi trạm
        final int MIN_STOCK = 20; // tối thiểu mỗi trạm nên có (note VN)
        int avg = (int) (total / n);

        Map<Integer, Integer> targetMap = new HashMap<>();
        for (Station s : stations) {
            int target = Math.max(MIN_STOCK, avg);
            targetMap.put(s.getStationId(), target);
        }

        // 4. Chi phí vận chuyển: khoảng cách Euclid đơn giản
        double[][] cost = new double[n][n];
        for (int i = 0; i < n; i++) {
            Station si = stations.get(i);
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    cost[i][j] = 0.0;
                } else {
                    Station sj = stations.get(j);
                    double dx = si.getLatitude().doubleValue() - sj.getLatitude().doubleValue();
                    double dy = si.getLongitude().doubleValue() - sj.getLongitude().doubleValue();
                    double dist = Math.sqrt(dx * dx + dy * dy);
                    cost[i][j] = dist == 0.0 ? 1.0 : dist; // tránh 0
                }
            }
        }

        // 5. Xây model ojAlgo
        ExpressionsBasedModel model = new ExpressionsBasedModel();

        Variable[][] x = new Variable[n][n];
        Variable[] shortage = new Variable[n];
        final double SHORTAGE_PENALTY = 1000.0;

        // 5.1. Tạo biến & constraint "send_limit"
        for (int i = 0; i < n; i++) {
            Station station = stations.get(i);
            int stationId = station.getStationId();
            long current = currentMap.getOrDefault(stationId, 0L);

            // shortage_i >= 0, weight lớn trong objective
            shortage[i] = model.addVariable("shortage_" + stationId)
                    .lower(0)
                    .weight(SHORTAGE_PENALTY);

            // x[i][j] >= 0, integer, weight = cost
            for (int j = 0; j < n; j++) {
                if (i == j) continue;

                int toId = stations.get(j).getStationId();
                x[i][j] = model.addVariable("x_" + stationId + "_to_" + toId)
                        .lower(0)
                        .integer(true)
                        .weight(cost[i][j]);
            }

            // ∑_j x[i][j] <= current(i)
            Expression sendLimit = model.addExpression("send_limit_" + stationId);
            for (int j = 0; j < n; j++) {
                if (i != j && x[i][j] != null) {
                    sendLimit.set(x[i][j], 1);
                }
            }
            sendLimit.upper(current);
        }

        // 5.2. Cân bằng tồn kho: current - out + in + shortage >= target
        for (int i = 0; i < n; i++) {
            Station station = stations.get(i);
            int stationId = station.getStationId();
            long current = currentMap.getOrDefault(stationId, 0L);
            int target = targetMap.get(stationId);

            Expression balance = model.addExpression("balance_" + stationId);

            // - outbound
            for (int j = 0; j < n; j++) {
                if (i != j && x[i][j] != null) {
                    balance.set(x[i][j], -1);
                }
            }

            // + inbound
            for (int k = 0; k < n; k++) {
                if (k != i && x[k][i] != null) {
                    balance.set(x[k][i], 1);
                }
            }

            // + shortage_i
            balance.set(shortage[i], 1);

            // current + (-out + in + shortage) >= target
            balance.lower(target - current);
        }

        // 6. Giải bài toán
        Optimisation.Result result = model.minimise();
        if (result.getState().isFailure()) {
            return Collections.emptyList();
        }
// 7. Đọc nghiệm → build danh sách gợi ý (kèm lý do cụ thể tiếng Việt)
        List<RebalanceSuggestion> suggestions = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            Station from = stations.get(i);
            int fromId = from.getStationId();
            long fromCurrent = currentMap.getOrDefault(fromId, 0L);
            int fromTarget = targetMap.get(fromId);

            for (int j = 0; j < n; j++) {
                if (i == j || x[i][j] == null) continue;

                int varIndex = model.indexOf(x[i][j]);
                if (varIndex < 0) continue;

                Number val = result.get(varIndex);
                if (val == null) continue;

                double raw = val.doubleValue();
                if (raw < 1.0) continue; // bỏ gợi ý < 1 pin

                int quantity = (int) Math.round(raw);

                // Trạm nhận
                Station to = stations.get(j);
                int toId = to.getStationId();
                long toCurrent = currentMap.getOrDefault(toId, 0L);
                int toTarget = targetMap.get(toId);

                // ① Xác định mức độ thiếu/dư pin
                long fromSurplus = fromCurrent - fromTarget;
                long toDeficit = toTarget - toCurrent;

                // ② Sinh lý do tiếng Việt dựa vào chênh lệch thực tế
                String reason;
                if (fromSurplus > 15 && toDeficit > 15) {
                    reason = "Trạm " + from.getStationName() + " đang dư nhiều pin, cần chuyển gấp sang "
                            + to.getStationName() + " để bù thiếu hụt nghiêm trọng.";
                } else if (fromSurplus > 10 && toDeficit > 5) {
                    reason = "Trạm " + from.getStationName() + " đang dư pin, đề xuất điều phối sang "
                            + to.getStationName() + " để cân bằng tồn kho.";
                } else if (fromSurplus > 0 && toDeficit > 0) {
                    reason = "Cân nhắc điều phối nhẹ từ " + from.getStationName()
                            + " sang " + to.getStationName() + " để giảm chênh lệch nhỏ về tồn kho.";
                } else if (cost[i][j] > 5.0) {
                    reason = "Khoảng cách xa, chỉ nên điều phối khi thực sự cần thiết.";
                } else {
                    reason = "Điều phối nội vùng để cân bằng lượng pin giữa hai trạm lân cận.";
                }

                // ③ Gán priority + confidence (tự động theo mức chênh lệch)
                String priority;
                int confidence;
                double imbalanceRatio = Math.min(1.0, (Math.abs(fromSurplus) + Math.abs(toDeficit)) / 40.0);

                if (imbalanceRatio >= 0.8) {
                    priority = "High";
                    confidence = 95;
                } else if (imbalanceRatio >= 0.5) {
                    priority = "Medium";
                    confidence = 88;
                } else {
                    priority = "Low";
                    confidence = 78;
                }

                // ④ Build đối tượng RebalanceSuggestion
                suggestions.add(
                        RebalanceSuggestion.builder()
                                .from(from.getStationName())
                                .to(to.getStationName())
                                .quantity(quantity)
                                .reason(reason)
                                .priority(priority)
                                .confidence(confidence)
                                .build()
                );
            }
        }

        return suggestions;
    }
}
