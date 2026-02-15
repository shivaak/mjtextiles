package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.DailySalesSummary;
import com.codewithshiva.retailpos.model.LowStockItem;
import com.codewithshiva.retailpos.model.RecentSale;
import com.codewithshiva.retailpos.model.TopSellingProduct;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * JDBI DAO for Dashboard operations.
 */
public interface DashboardDao {

    // ==========================================
    // Dashboard Stats Queries
    // ==========================================

    @SqlQuery("""
        SELECT COALESCE(SUM(total - points_redemption_amount), 0) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    BigDecimal getTotalSales(@Bind("startDate") OffsetDateTime startDate,
                             @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COALESCE(SUM(profit), 0) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    BigDecimal getTotalProfit(@Bind("startDate") OffsetDateTime startDate,
                              @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COUNT(*) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    Long getTotalTransactions(@Bind("startDate") OffsetDateTime startDate,
                              @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COALESCE(AVG(total - points_redemption_amount), 0) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    BigDecimal getAvgOrderValue(@Bind("startDate") OffsetDateTime startDate,
                                @Bind("endDate") OffsetDateTime endDate);

    /**
     * Get count of low stock variants (stock_qty <= threshold, including out of stock).
     * Uses v_low_stock_variants view.
     */
    @SqlQuery("""
        SELECT COUNT(*) 
        FROM v_low_stock_variants
        """)
    Integer getLowStockCount();

    /**
     * Get count of out of stock variants (stock_qty = 0).
     */
    @SqlQuery("""
        SELECT COUNT(*) 
        FROM variants 
        WHERE status = 'ACTIVE' AND stock_qty = 0
        """)
    Integer getOutOfStockCount();

    /**
     * Get total count of active SKUs.
     */
    @SqlQuery("SELECT COUNT(*) FROM variants WHERE status = 'ACTIVE'")
    Integer getTotalSkus();

    // ==========================================
    // Sales Trend using v_daily_sales_summary
    // ==========================================

    @SqlQuery("""
        SELECT 
            sale_date as saleDate,
            transaction_count as transactionCount,
            total_sales as totalSales,
            total_profit as totalProfit,
            voided_count as voidedCount,
            cash_count as cashCount,
            card_count as cardCount,
            upi_count as upiCount,
            credit_count as creditCount
        FROM v_daily_sales_summary
        WHERE sale_date >= :startDate
        ORDER BY sale_date ASC
        """)
    @RegisterConstructorMapper(DailySalesSummary.class)
    List<DailySalesSummary> getSalesTrend(@Bind("startDate") java.time.LocalDate startDate);

    // ==========================================
    // Top Selling Products
    // ==========================================

    @SqlQuery("""
        WITH line_calc AS (
            SELECT
                si.variant_id,
                p.name as productName,
                v.sku,
                v.size,
                v.color,
                si.qty,
                si.unit_price,
                si.unit_cost_at_sale,
                COALESCE(si.item_discount_percent, 0) as item_discount_percent,
                COALESCE(s.discount_amount, 0) as discount_amount,
                COALESCE(s.tax_percent, 0) as tax_percent,
                COALESCE(s.points_redemption_amount, 0) as points_redemption_amount,
                s.total,
                (si.unit_price * (1 - COALESCE(si.item_discount_percent, 0) / 100.0) * si.qty) as line_amount
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN variants v ON si.variant_id = v.id
            JOIN products p ON v.product_id = p.id
            WHERE s.status = 'COMPLETED'
              AND s.sold_at >= :startDate
              AND s.sold_at < :endDate
        )
        SELECT
            variant_id as variantId,
            productName,
            sku,
            size,
            color,
            SUM(qty) as qtySold,
            SUM(line_taxable) as revenue,
            SUM(line_taxable - line_cost - allocated_discount - allocated_redemption) as profit
        FROM (
            SELECT
                *,
                line_amount / (1 + tax_percent / 100.0) as line_taxable,
                (unit_cost_at_sale * qty) as line_cost,
                COALESCE(discount_amount * (line_amount / NULLIF(total, 0)), 0) as allocated_discount,
                COALESCE(points_redemption_amount * (line_amount / NULLIF(total, 0)), 0) as allocated_redemption
            FROM line_calc
        ) t
        GROUP BY variant_id, productName, sku, size, color
        ORDER BY qtySold DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(TopSellingProduct.class)
    List<TopSellingProduct> getTopSellingProducts(@Bind("startDate") OffsetDateTime startDate,
                                                   @Bind("endDate") OffsetDateTime endDate,
                                                   @Bind("limit") Integer limit);

    // ==========================================
    // Low Stock Items using v_low_stock_variants
    // ==========================================

    @SqlQuery("""
        SELECT 
            id as variantId,
            product_name as productName,
            sku,
            size,
            color,
            stock_qty as stockQty,
            low_stock_threshold as threshold
        FROM v_low_stock_variants
        ORDER BY stock_qty ASC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(LowStockItem.class)
    List<LowStockItem> getLowStockItems(@Bind("limit") Integer limit);

    // ==========================================
    // Recent Sales using v_sales_with_details
    // ==========================================

    @SqlQuery("""
        SELECT 
            id,
            bill_no as billNo,
            sold_at as soldAt,
            customer_name as customerName,
            (total - points_redemption_amount) as total,
            item_count as itemCount,
            payment_mode as paymentMode,
            status
        FROM v_sales_with_details
        ORDER BY sold_at DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(RecentSale.class)
    List<RecentSale> getRecentSales(@Bind("limit") Integer limit);
}
