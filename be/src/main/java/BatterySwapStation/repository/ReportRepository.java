//package BatterySwapStation.repository;
//
//import BatterySwapStation.entity.ReportDummy;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDate;
//import java.util.List;
//import java.util.Map;
//
//@Repository
//@Transactional(readOnly = true)
//public interface ReportRepository extends JpaRepository<ReportDummy, Long> {
//
//    @Query(value = """
//        SELECT
//            s.stationid AS "stationId",
//            s.station_name AS "stationName",
//            s.address AS "address",
//            COALESCE(SUM(i.total_amount), 0) AS "totalRevenue",
//            COUNT(DISTINCT sw.swapid) AS "totalTransactions",
//            COUNT(DISTINCT b.batteryid) AS "managedBatteries",
//            ROUND(
//                (COUNT(DISTINCT ds.dockslotid) FILTER (WHERE ds.status = 'OCCUPIED') * 100.0) /
//                NULLIF(COUNT(DISTINCT ds.dockslotid), 0), 2
//            ) AS "efficiencyRate"
//        FROM station s
//        LEFT JOIN swap sw ON sw.stationid = s.stationid
//        LEFT JOIN invoice i ON i.stationid = s.stationid
//        LEFT JOIN dockslot ds ON ds.dockid IN (
//            SELECT d.dockid FROM dock d WHERE d.stationid = s.stationid
//        )
//        LEFT JOIN battery b ON b.stationid = s.stationid
//        GROUP BY s.stationid, s.station_name, s.address
//        ORDER BY s.stationid
//    """, nativeQuery = true)
//    List<Map<String, Object>> fetchStationPerformance();
//
//    @Query(value = """
//        SELECT
//            DATE(i.created_date) AS "date",
//            COALESCE(SUM(i.total_amount), 0) AS "totalRevenue",
//            COUNT(i.invoiceid) AS "transactions"
//        FROM invoice i
//        JOIN payment p ON p.invoiceid = i.invoiceid
//        WHERE p.payment_status = 'SUCCESS'
//          AND i.created_date BETWEEN :startDate AND :endDate
//        GROUP BY DATE(i.created_date)
//        ORDER BY DATE(i.created_date)
//    """, nativeQuery = true)
//    List<Map<String, Object>> fetchDailyRevenue(@Param("startDate") LocalDate startDate,
//                                                @Param("endDate") LocalDate endDate);
//
//    @Query(value = """
//        SELECT
//            DATE(sw.start_time) AS "date",
//            COUNT(sw.swapid) AS "swapCount",
//            COALESCE(SUM(i.total_amount), 0) AS "revenue"
//        FROM swap sw
//        LEFT JOIN invoice i ON i.stationid = sw.stationid
//        WHERE sw.start_time BETWEEN :startDate AND :endDate
//        GROUP BY DATE(sw.start_time)
//        ORDER BY DATE(sw.start_time)
//    """, nativeQuery = true)
//    List<Map<String, Object>> fetchDailySwaps(@Param("startDate") LocalDate startDate,
//                                              @Param("endDate") LocalDate endDate);
//}
