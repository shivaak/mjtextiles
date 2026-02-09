package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.*;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.math.BigDecimal;
import java.util.List;

/**
 * JDBI DAO for Customer Analytics operations.
 */
public interface CustomerAnalyticsDao {

    // ==========================================
    // Summary Stats
    // ==========================================

    @SqlQuery("SELECT COUNT(*) FROM customers")
    Long getTotalCustomers();

    @SqlQuery("""
        SELECT COUNT(DISTINCT c.id)
        FROM customers c
        INNER JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
        """)
    Long getCustomersWithPurchases();

    @SqlQuery("""
        SELECT COALESCE(SUM(s.total - s.points_redemption_amount), 0)
        FROM sales s
        INNER JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 'COMPLETED'
        """)
    BigDecimal getTotalCustomerRevenue();

    @SqlQuery("""
        SELECT COALESCE(AVG(s.total - s.points_redemption_amount), 0)
        FROM sales s
        INNER JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 'COMPLETED'
        """)
    BigDecimal getAvgOrderValue();

    @SqlQuery("""
        SELECT COUNT(*)
        FROM sales s
        INNER JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 'COMPLETED'
        """)
    Long getTotalCustomerTransactions();

    @SqlQuery("SELECT COALESCE(SUM(total_points_earned), 0) FROM customers")
    Integer getTotalPointsEarned();

    @SqlQuery("SELECT COALESCE(SUM(total_points_redeemed), 0) FROM customers")
    Integer getTotalPointsRedeemed();

    @SqlQuery("SELECT COALESCE(SUM(loyalty_points), 0) FROM customers")
    Integer getTotalPointsBalance();

    @SqlQuery("""
        SELECT COUNT(*) FROM (
            SELECT c.id
            FROM customers c
            INNER JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
            GROUP BY c.id
            HAVING COUNT(s.id) > 1
        ) repeat_customers
        """)
    Long getRepeatCustomers();

    // ==========================================
    // Top Customers Ranking
    // ==========================================

    @SqlQuery("""
        SELECT
            c.id as customerId,
            c.name,
            c.phone,
            c.area,
            COUNT(s.id) as purchaseCount,
            COALESCE(SUM(s.total - s.points_redemption_amount), 0) as totalSpent,
            COALESCE(AVG(s.total - s.points_redemption_amount), 0) as avgOrderValue,
            MAX(s.sold_at) as lastPurchaseAt,
            c.loyalty_points as loyaltyPoints
        FROM customers c
        INNER JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
        GROUP BY c.id, c.name, c.phone, c.area, c.loyalty_points
        ORDER BY purchaseCount DESC, totalSpent DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(CustomerRanking.class)
    List<CustomerRanking> getTopCustomersByPurchaseCount(@Bind("limit") Integer limit);

    @SqlQuery("""
        SELECT
            c.id as customerId,
            c.name,
            c.phone,
            c.area,
            COUNT(s.id) as purchaseCount,
            COALESCE(SUM(s.total - s.points_redemption_amount), 0) as totalSpent,
            COALESCE(AVG(s.total - s.points_redemption_amount), 0) as avgOrderValue,
            MAX(s.sold_at) as lastPurchaseAt,
            c.loyalty_points as loyaltyPoints
        FROM customers c
        INNER JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
        GROUP BY c.id, c.name, c.phone, c.area, c.loyalty_points
        ORDER BY totalSpent DESC, purchaseCount DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(CustomerRanking.class)
    List<CustomerRanking> getTopCustomersByRevenue(@Bind("limit") Integer limit);

    // ==========================================
    // Area-wise Distribution
    // ==========================================

    @SqlQuery("""
        SELECT
            COALESCE(NULLIF(TRIM(c.area), ''), 'Unknown') as area,
            COUNT(DISTINCT c.id) as customerCount,
            COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN c.id END) as activeCustomers,
            COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total - s.points_redemption_amount ELSE 0 END), 0) as totalRevenue
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
        GROUP BY COALESCE(NULLIF(TRIM(c.area), ''), 'Unknown')
        ORDER BY customerCount DESC
        """)
    @RegisterConstructorMapper(AreaDistribution.class)
    List<AreaDistribution> getAreaDistribution();

    // ==========================================
    // Monthly New Customers Trend
    // ==========================================

    @SqlQuery("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
            COUNT(*) as newCustomers
        FROM customers
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
        """)
    @RegisterConstructorMapper(MonthlyCustomerTrend.class)
    List<MonthlyCustomerTrend> getMonthlyNewCustomerTrend();

    // ==========================================
    // Purchase Frequency Distribution
    // ==========================================

    @SqlQuery("""
        WITH customer_counts AS (
            SELECT c.id,
                   COUNT(s.id) as purchase_count
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
            GROUP BY c.id
        )
        SELECT
            CASE
                WHEN purchase_count = 0 THEN 'No purchases'
                WHEN purchase_count = 1 THEN '1 purchase'
                WHEN purchase_count BETWEEN 2 AND 5 THEN '2-5 purchases'
                WHEN purchase_count BETWEEN 6 AND 10 THEN '6-10 purchases'
                ELSE '10+ purchases'
            END as bucket,
            COUNT(*) as customerCount,
            CASE
                WHEN purchase_count = 0 THEN 0
                WHEN purchase_count = 1 THEN 1
                WHEN purchase_count BETWEEN 2 AND 5 THEN 2
                WHEN purchase_count BETWEEN 6 AND 10 THEN 3
                ELSE 4
            END as sortOrder
        FROM customer_counts
        GROUP BY
            CASE
                WHEN purchase_count = 0 THEN 'No purchases'
                WHEN purchase_count = 1 THEN '1 purchase'
                WHEN purchase_count BETWEEN 2 AND 5 THEN '2-5 purchases'
                WHEN purchase_count BETWEEN 6 AND 10 THEN '6-10 purchases'
                ELSE '10+ purchases'
            END,
            CASE
                WHEN purchase_count = 0 THEN 0
                WHEN purchase_count = 1 THEN 1
                WHEN purchase_count BETWEEN 2 AND 5 THEN 2
                WHEN purchase_count BETWEEN 6 AND 10 THEN 3
                ELSE 4
            END
        ORDER BY sortOrder ASC
        """)
    @RegisterConstructorMapper(PurchaseFrequency.class)
    List<PurchaseFrequency> getPurchaseFrequencyDistribution();
}
