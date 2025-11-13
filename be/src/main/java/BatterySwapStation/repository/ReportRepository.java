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

    // Optimized station performance: use pre-aggregated subqueries to avoid large intermediate joins
    @Query(value = """
        SELECT
            s.stationid AS "stationId",
            s.stationname AS "stationName",
            s.address AS "address",
            COALESCE(ir.totalrevenue, 0) AS "totalRevenue",
            COALESCE(sw.total_transactions, 0) AS "totalTransactions",
            COALESCE(bc.managed_batteries, 0) AS "managedBatteries",
            CASE WHEN COALESCE(sl.total_slots, 0) = 0 THEN 0
                 ELSE ROUND( (sl.occupied_slots::numeric * 100.0) / sl.total_slots, 2)
            END AS "efficiencyRate"
        FROM station s
        LEFT JOIN (
            SELECT b.stationid, SUM(i.totalamount) AS totalrevenue
            FROM invoice i
            JOIN booking b ON b.invoiceid = i.invoiceid
            GROUP BY b.stationid
        ) ir ON ir.stationid = s.stationid
        LEFT JOIN (
            SELECT d.stationid, COUNT(sw.swapid) AS total_transactions
            FROM swap sw
            JOIN dock d ON sw.dockid = d.dockid
            GROUP BY d.stationid
        ) sw ON sw.stationid = s.stationid
        LEFT JOIN (
            SELECT stationid, COUNT(batteryid) AS managed_batteries
            FROM battery
            GROUP BY stationid
        ) bc ON bc.stationid = s.stationid
        LEFT JOIN (
            SELECT d.stationid,
                   COUNT(ds.dockslotid) AS total_slots,
                   COUNT(ds.dockslotid) FILTER (WHERE ds.slotstatus = 'OCCUPIED') AS occupied_slots
            FROM dockslot ds
            JOIN dock d ON ds.dockid = d.dockid
            GROUP BY d.stationid
        ) sl ON sl.stationid = s.stationid
        ORDER BY s.stationid
    """, nativeQuery = true)
    List<Map<String, Object>> fetchStationPerformance();

}
