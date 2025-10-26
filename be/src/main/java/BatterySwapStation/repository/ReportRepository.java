package BatterySwapStation.repository;

import BatterySwapStation.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // ✅ Doanh thu theo giờ
    @Query(value = """
        SELECT 
            DATE(i.createddate) AS "date",
            EXTRACT(HOUR FROM i.createddate) AS "hour",
            COALESCE(SUM(i.totalamount), 0) AS "totalRevenue",
            COUNT(i.invoiceid) AS "transactions"
        FROM invoice i
        JOIN payment p ON p.invoiceid = i.invoiceid
        WHERE p.paymentstatus = 'SUCCESS'
          AND i.createddate BETWEEN :startDate AND :endDate
        GROUP BY DATE(i.createddate), EXTRACT(HOUR FROM i.createddate)
        ORDER BY DATE(i.createddate), "hour"
    """, nativeQuery = true)
    List<Map<String, Object>> fetchHourlyRevenue(@Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate);

    // ✅ Doanh thu theo ngày
    @Query(value = """
        SELECT 
            DATE(i.createddate) AS "date",
            COALESCE(SUM(i.totalamount), 0) AS "totalRevenue",
            COUNT(i.invoiceid) AS "transactions"
        FROM invoice i
        JOIN payment p ON p.invoiceid = i.invoiceid
        WHERE p.paymentstatus = 'SUCCESS'
          AND i.createddate BETWEEN :startDate AND :endDate
        GROUP BY DATE(i.createddate)
        ORDER BY DATE(i.createddate)
    """, nativeQuery = true)
    List<Map<String, Object>> fetchDailyRevenue(@Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    // ✅ Lượt swap theo giờ
    @Query(value = """
        SELECT 
            DATE(sw.completedtime) AS "date",
            EXTRACT(HOUR FROM sw.completedtime) AS "hour",
            COUNT(sw.swapid) AS "swapCount"
        FROM swap sw
        WHERE sw.completedtime BETWEEN :startDate AND :endDate
        GROUP BY DATE(sw.completedtime), EXTRACT(HOUR FROM sw.completedtime)
        ORDER BY DATE(sw.completedtime), "hour"
    """, nativeQuery = true)
    List<Map<String, Object>> fetchHourlySwap(@Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    // ✅ Lượt swap theo ngày
    @Query(value = """
        SELECT 
            DATE(sw.completedtime) AS "date",
            COUNT(sw.swapid) AS "swapCount"
        FROM swap sw
        WHERE sw.completedtime BETWEEN :startDate AND :endDate
        GROUP BY DATE(sw.completedtime)
        ORDER BY DATE(sw.completedtime)
    """, nativeQuery = true)
    List<Map<String, Object>> fetchDailySwap(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    // ✅ Hiệu suất trạm (đã fix theo schema thật)
    @Query(value = """
        SELECT 
            s.stationid AS "stationId",
            s.stationname AS "stationName",
            s.address AS "address",
            COALESCE(SUM(i.totalamount), 0) AS "totalRevenue",
            COUNT(DISTINCT sw.swapid) AS "totalTransactions",
            COUNT(DISTINCT b.batteryid) AS "managedBatteries",
            ROUND(
                (COUNT(DISTINCT ds.dockslotid) FILTER (WHERE ds.slotstatus = 'OCCUPIED') * 100.0) /
                NULLIF(COUNT(DISTINCT ds.dockslotid), 0), 2
            ) AS "efficiencyRate"
        FROM station s
        LEFT JOIN dock d ON d.stationid = s.stationid
        LEFT JOIN dockslot ds ON ds.dockid = d.dockid
        LEFT JOIN swap sw ON sw.dockid = d.dockid
        LEFT JOIN invoice i ON i.userid IS NOT NULL  
        LEFT JOIN battery b ON b.stationid = s.stationid
        GROUP BY s.stationid, s.stationname, s.address
        ORDER BY s.stationid
    """, nativeQuery = true)
    List<Map<String, Object>> fetchStationPerformance();

}
