package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.report.*;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * JDBI DAO for Report operations.
 */
public interface ReportDao {

    // ==========================================
    // Sales Summary Report - Totals
    // ==========================================

    @SqlQuery("""
        SELECT COALESCE(SUM(total), 0) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    BigDecimal getSalesTotalSales(@Bind("startDate") OffsetDateTime startDate,
                                   @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COALESCE(SUM(profit), 0) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    BigDecimal getSalesTotalProfit(@Bind("startDate") OffsetDateTime startDate,
                                    @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COUNT(*) 
        FROM sales 
        WHERE status = 'COMPLETED' 
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        """)
    Long getSalesTotalTransactions(@Bind("startDate") OffsetDateTime startDate,
                                    @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Sales Summary - Daily Breakdown (uses v_daily_sales_summary)
    // ==========================================

    @SqlQuery("""
        SELECT 
            TO_CHAR(sale_date, 'YYYY-MM-DD') as period,
            total_sales as sales,
            total_profit as profit,
            transaction_count as transactions
        FROM v_daily_sales_summary
        WHERE sale_date >= :startDate AND sale_date <= :endDate
        ORDER BY sale_date
        """)
    @RegisterConstructorMapper(SalesPeriodData.class)
    List<SalesPeriodData> getSalesByDay(@Bind("startDate") java.time.LocalDate startDate,
                                        @Bind("endDate") java.time.LocalDate endDate);

    // ==========================================
    // Sales Summary - Weekly Breakdown
    // ==========================================

    @SqlQuery("""
        SELECT 
            TO_CHAR(DATE_TRUNC('week', sold_at), 'YYYY-MM-DD') as period,
            COALESCE(SUM(total), 0) as sales,
            COALESCE(SUM(profit), 0) as profit,
            COUNT(*) as transactions
        FROM sales
        WHERE status = 'COMPLETED'
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        GROUP BY DATE_TRUNC('week', sold_at)
        ORDER BY period
        """)
    @RegisterConstructorMapper(SalesPeriodData.class)
    List<SalesPeriodData> getSalesByWeek(@Bind("startDate") OffsetDateTime startDate,
                                         @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Sales Summary - Monthly Breakdown
    // ==========================================

    @SqlQuery("""
        SELECT 
            TO_CHAR(DATE_TRUNC('month', sold_at), 'YYYY-MM') as period,
            COALESCE(SUM(total), 0) as sales,
            COALESCE(SUM(profit), 0) as profit,
            COUNT(*) as transactions
        FROM sales
        WHERE status = 'COMPLETED'
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        GROUP BY DATE_TRUNC('month', sold_at)
        ORDER BY period
        """)
    @RegisterConstructorMapper(SalesPeriodData.class)
    List<SalesPeriodData> getSalesByMonth(@Bind("startDate") OffsetDateTime startDate,
                                          @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Sales Summary - Payment Mode Breakdown
    // ==========================================

    @SqlQuery("""
        SELECT 
            payment_mode as mode,
            COALESCE(SUM(total), 0) as amount,
            COUNT(*) as count
        FROM sales
        WHERE status = 'COMPLETED'
          AND sold_at >= :startDate 
          AND sold_at < :endDate
        GROUP BY payment_mode
        ORDER BY amount DESC
        """)
    @RegisterConstructorMapper(PaymentModeData.class)
    List<PaymentModeData> getPaymentModeBreakdown(@Bind("startDate") OffsetDateTime startDate,
                                                   @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Product Performance - Top Sellers
    // ==========================================

    @SqlQuery("""
        SELECT 
            si.variant_id as variantId,
            p.name as productName,
            v.sku,
            p.category,
            p.brand,
            SUM(si.qty) as qtySold,
            SUM(si.qty * si.unit_price) as revenue,
            SUM(si.qty * si.unit_cost_at_sale) as cost,
            SUM((si.unit_price - si.unit_cost_at_sale) * si.qty) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
          AND (:category IS NULL OR p.category = :category)
          AND (:brand IS NULL OR p.brand = :brand)
        GROUP BY si.variant_id, p.name, v.sku, p.category, p.brand
        ORDER BY 
            CASE WHEN :sortBy = 'qtySold' AND :sortOrder = 'DESC' THEN SUM(si.qty) END DESC,
            CASE WHEN :sortBy = 'qtySold' AND :sortOrder = 'ASC' THEN SUM(si.qty) END ASC,
            CASE WHEN :sortBy = 'revenue' AND :sortOrder = 'DESC' THEN SUM(si.qty * si.unit_price) END DESC,
            CASE WHEN :sortBy = 'revenue' AND :sortOrder = 'ASC' THEN SUM(si.qty * si.unit_price) END ASC,
            CASE WHEN :sortBy = 'profit' AND :sortOrder = 'DESC' THEN SUM((si.unit_price - si.unit_cost_at_sale) * si.qty) END DESC,
            CASE WHEN :sortBy = 'profit' AND :sortOrder = 'ASC' THEN SUM((si.unit_price - si.unit_cost_at_sale) * si.qty) END ASC,
            SUM(si.qty) DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(ProductSalesData.class)
    List<ProductSalesData> getTopSellingProducts(@Bind("startDate") OffsetDateTime startDate,
                                                  @Bind("endDate") OffsetDateTime endDate,
                                                  @Bind("category") String category,
                                                  @Bind("brand") String brand,
                                                  @Bind("sortBy") String sortBy,
                                                  @Bind("sortOrder") String sortOrder,
                                                  @Bind("limit") Integer limit);

    // ==========================================
    // Product Performance - Slow Movers
    // ==========================================

    @SqlQuery("""
        SELECT 
            v.id as variantId,
            p.name as productName,
            v.sku,
            COALESCE(SUM(si.qty), 0) as qtySold,
            COALESCE(EXTRACT(DAY FROM NOW() - MAX(s.sold_at))::INTEGER, 999) as daysSinceLastSale,
            v.stock_qty as stockQty
        FROM variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN sale_items si ON si.variant_id = v.id
        LEFT JOIN sales s ON si.sale_id = s.id 
            AND s.status = 'COMPLETED'
            AND s.sold_at >= :startDate
            AND s.sold_at < :endDate
        WHERE v.status = 'ACTIVE'
          AND v.stock_qty > 0
        GROUP BY v.id, p.name, v.sku, v.stock_qty
        HAVING COALESCE(SUM(si.qty), 0) < 3
        ORDER BY qtySold ASC, daysSinceLastSale DESC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(SlowMoverData.class)
    List<SlowMoverData> getSlowMovers(@Bind("startDate") OffsetDateTime startDate,
                                       @Bind("endDate") OffsetDateTime endDate,
                                       @Bind("limit") Integer limit);

    // ==========================================
    // Product Performance - Category Breakdown
    // ==========================================

    @SqlQuery("""
        SELECT 
            p.category,
            SUM(si.qty) as qtySold,
            SUM(si.qty * si.unit_price) as revenue,
            SUM(si.qty * si.unit_cost_at_sale) as cost,
            SUM((si.unit_price - si.unit_cost_at_sale) * si.qty) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        GROUP BY p.category
        ORDER BY revenue DESC
        """)
    @RegisterConstructorMapper(CategorySalesData.class)
    List<CategorySalesData> getCategoryBreakdown(@Bind("startDate") OffsetDateTime startDate,
                                                  @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Profit Report - Summary
    // ==========================================

    @SqlQuery("""
        SELECT COALESCE(SUM(si.qty * si.unit_price), 0)
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        """)
    BigDecimal getProfitTotalRevenue(@Bind("startDate") OffsetDateTime startDate,
                                      @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT COALESCE(SUM(si.qty * si.unit_cost_at_sale), 0)
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        """)
    BigDecimal getProfitTotalCost(@Bind("startDate") OffsetDateTime startDate,
                                   @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Profit Report - Trend by Day/Week/Month
    // ==========================================

    @SqlQuery("""
        SELECT 
            TO_CHAR(DATE(s.sold_at), 'YYYY-MM-DD') as period,
            COALESCE(SUM(si.qty * si.unit_price), 0) as revenue,
            COALESCE(SUM(si.qty * si.unit_cost_at_sale), 0) as cost,
            COALESCE(SUM((si.unit_price - si.unit_cost_at_sale) * si.qty), 0) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        GROUP BY DATE(s.sold_at)
        ORDER BY period
        """)
    @RegisterConstructorMapper(ProfitPeriodData.class)
    List<ProfitPeriodData> getProfitTrendByDay(@Bind("startDate") OffsetDateTime startDate,
                                                @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT 
            TO_CHAR(DATE_TRUNC('week', s.sold_at), 'YYYY-MM-DD') as period,
            COALESCE(SUM(si.qty * si.unit_price), 0) as revenue,
            COALESCE(SUM(si.qty * si.unit_cost_at_sale), 0) as cost,
            COALESCE(SUM((si.unit_price - si.unit_cost_at_sale) * si.qty), 0) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        GROUP BY DATE_TRUNC('week', s.sold_at)
        ORDER BY period
        """)
    @RegisterConstructorMapper(ProfitPeriodData.class)
    List<ProfitPeriodData> getProfitTrendByWeek(@Bind("startDate") OffsetDateTime startDate,
                                                 @Bind("endDate") OffsetDateTime endDate);

    @SqlQuery("""
        SELECT 
            TO_CHAR(DATE_TRUNC('month', s.sold_at), 'YYYY-MM') as period,
            COALESCE(SUM(si.qty * si.unit_price), 0) as revenue,
            COALESCE(SUM(si.qty * si.unit_cost_at_sale), 0) as cost,
            COALESCE(SUM((si.unit_price - si.unit_cost_at_sale) * si.qty), 0) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        GROUP BY DATE_TRUNC('month', s.sold_at)
        ORDER BY period
        """)
    @RegisterConstructorMapper(ProfitPeriodData.class)
    List<ProfitPeriodData> getProfitTrendByMonth(@Bind("startDate") OffsetDateTime startDate,
                                                  @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Profit Report - By Cashier (uses v_sales_with_details)
    // ==========================================

    @SqlQuery("""
        SELECT 
            s.created_by as userId,
            s.created_by_name as userName,
            COALESCE(SUM(s.total), 0) as revenue,
            COALESCE(SUM(s.profit), 0) as profit,
            COUNT(*) as transactions
        FROM v_sales_with_details s
        WHERE s.status = 'COMPLETED'
          AND s.sold_at >= :startDate
          AND s.sold_at < :endDate
        GROUP BY s.created_by, s.created_by_name
        ORDER BY revenue DESC
        """)
    @RegisterConstructorMapper(CashierSalesData.class)
    List<CashierSalesData> getProfitByCashier(@Bind("startDate") OffsetDateTime startDate,
                                               @Bind("endDate") OffsetDateTime endDate);

    // ==========================================
    // Inventory Valuation - Summary (uses v_variants_with_products)
    // ==========================================

    @SqlQuery("""
        SELECT COUNT(*) FROM variants WHERE status = 'ACTIVE'
        """)
    Integer getInventoryTotalSkus();

    @SqlQuery("""
        SELECT COALESCE(SUM(stock_qty), 0) FROM variants WHERE status = 'ACTIVE'
        """)
    Long getInventoryTotalItems();

    @SqlQuery("""
        SELECT COALESCE(SUM(stock_value), 0) 
        FROM v_variants_with_products 
        WHERE status = 'ACTIVE'
        """)
    BigDecimal getInventoryTotalCostValue();

    @SqlQuery("""
        SELECT COALESCE(SUM(stock_qty * selling_price), 0) 
        FROM v_variants_with_products 
        WHERE status = 'ACTIVE'
        """)
    BigDecimal getInventoryTotalRetailValue();

    // ==========================================
    // Inventory Valuation - By Category (uses v_variants_with_products)
    // ==========================================

    @SqlQuery("""
        SELECT 
            product_category as groupName,
            COUNT(*) as skuCount,
            COALESCE(SUM(stock_qty), 0) as itemCount,
            COALESCE(SUM(stock_value), 0) as costValue,
            COALESCE(SUM(stock_qty * selling_price), 0) as retailValue
        FROM v_variants_with_products
        WHERE status = 'ACTIVE'
          AND (:category IS NULL OR product_category = :category)
          AND (:brand IS NULL OR product_brand = :brand)
        GROUP BY product_category
        ORDER BY costValue DESC
        """)
    @RegisterConstructorMapper(InventoryGroupData.class)
    List<InventoryGroupData> getInventoryByCategory(@Bind("category") String category,
                                                     @Bind("brand") String brand);

    // ==========================================
    // Inventory Valuation - By Brand (uses v_variants_with_products)
    // ==========================================

    @SqlQuery("""
        SELECT 
            product_brand as groupName,
            COUNT(*) as skuCount,
            COALESCE(SUM(stock_qty), 0) as itemCount,
            COALESCE(SUM(stock_value), 0) as costValue,
            COALESCE(SUM(stock_qty * selling_price), 0) as retailValue
        FROM v_variants_with_products
        WHERE status = 'ACTIVE'
          AND (:category IS NULL OR product_category = :category)
          AND (:brand IS NULL OR product_brand = :brand)
        GROUP BY product_brand
        ORDER BY costValue DESC
        """)
    @RegisterConstructorMapper(InventoryGroupData.class)
    List<InventoryGroupData> getInventoryByBrand(@Bind("category") String category,
                                                  @Bind("brand") String brand);

    // ==========================================
    // Low Stock Report - Counts (uses v_low_stock_variants)
    // ==========================================

    @SqlQuery("""
        SELECT COUNT(*) 
        FROM v_low_stock_variants 
        WHERE stock_qty > 0
          AND (:category IS NULL OR product_category = :category)
          AND (:brand IS NULL OR product_brand = :brand)
        """)
    Integer getLowStockCount(@Bind("category") String category,
                             @Bind("brand") String brand);

    @SqlQuery("""
        SELECT COUNT(*) 
        FROM variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.status = 'ACTIVE' 
          AND v.stock_qty = 0
          AND (:category IS NULL OR p.category = :category)
          AND (:brand IS NULL OR p.brand = :brand)
        """)
    Integer getOutOfStockCount(@Bind("category") String category,
                               @Bind("brand") String brand);

    // ==========================================
    // Low Stock Report - Items with Purchase Info
    // ==========================================

    @SqlQuery("""
        WITH last_purchase AS (
            SELECT DISTINCT ON (pi.variant_id)
                pi.variant_id,
                pi.unit_cost as last_price,
                sup.name as supplier_name
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            JOIN suppliers sup ON p.supplier_id = sup.id
            ORDER BY pi.variant_id, p.purchased_at DESC
        ),
        monthly_sales AS (
            SELECT 
                si.variant_id,
                COALESCE(SUM(si.qty) / 
                    GREATEST(1, EXTRACT(MONTH FROM AGE(NOW(), MIN(s.sold_at)))::numeric), 0) as avg_monthly
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'COMPLETED'
              AND s.sold_at >= NOW() - INTERVAL '6 months'
            GROUP BY si.variant_id
        )
        SELECT 
            lsv.id as variantId,
            lsv.product_name as productName,
            lsv.sku,
            lsv.product_category as category,
            lsv.product_brand as brand,
            lsv.stock_qty as currentStock,
            lsv.low_stock_threshold as threshold,
            COALESCE(ms.avg_monthly, 0) as avgMonthlySales,
            lp.last_price as lastPurchasePrice,
            lp.supplier_name as lastSupplier
        FROM v_low_stock_variants lsv
        LEFT JOIN last_purchase lp ON lp.variant_id = lsv.id
        LEFT JOIN monthly_sales ms ON ms.variant_id = lsv.id
        WHERE (:category IS NULL OR lsv.product_category = :category)
          AND (:brand IS NULL OR lsv.product_brand = :brand)
          AND (:includeOutOfStock = true OR lsv.stock_qty > 0)
        ORDER BY lsv.stock_qty ASC
        """)
    @RegisterConstructorMapper(LowStockItemData.class)
    List<LowStockItemData> getLowStockItems(@Bind("category") String category,
                                             @Bind("brand") String brand,
                                             @Bind("includeOutOfStock") Boolean includeOutOfStock);

    // ==========================================
    // Low Stock - Out of Stock Items (for when includeOutOfStock is true)
    // ==========================================

    @SqlQuery("""
        WITH last_purchase AS (
            SELECT DISTINCT ON (pi.variant_id)
                pi.variant_id,
                pi.unit_cost as last_price,
                sup.name as supplier_name
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            JOIN suppliers sup ON p.supplier_id = sup.id
            ORDER BY pi.variant_id, p.purchased_at DESC
        ),
        monthly_sales AS (
            SELECT 
                si.variant_id,
                COALESCE(SUM(si.qty) / 
                    GREATEST(1, EXTRACT(MONTH FROM AGE(NOW(), MIN(s.sold_at)))::numeric), 0) as avg_monthly
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'COMPLETED'
              AND s.sold_at >= NOW() - INTERVAL '6 months'
            GROUP BY si.variant_id
        )
        SELECT 
            v.id as variantId,
            p.name as productName,
            v.sku,
            p.category,
            p.brand,
            v.stock_qty as currentStock,
            s.low_stock_threshold as threshold,
            COALESCE(ms.avg_monthly, 0) as avgMonthlySales,
            lp.last_price as lastPurchasePrice,
            lp.supplier_name as lastSupplier
        FROM variants v
        JOIN products p ON v.product_id = p.id
        CROSS JOIN settings s
        LEFT JOIN last_purchase lp ON lp.variant_id = v.id
        LEFT JOIN monthly_sales ms ON ms.variant_id = v.id
        WHERE v.status = 'ACTIVE'
          AND v.stock_qty = 0
          AND (:category IS NULL OR p.category = :category)
          AND (:brand IS NULL OR p.brand = :brand)
        ORDER BY p.name, v.sku
        """)
    @RegisterConstructorMapper(LowStockItemData.class)
    List<LowStockItemData> getOutOfStockItems(@Bind("category") String category,
                                               @Bind("brand") String brand);
}
