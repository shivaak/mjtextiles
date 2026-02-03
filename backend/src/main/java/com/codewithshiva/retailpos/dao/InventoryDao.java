package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.InventorySummary;
import com.codewithshiva.retailpos.model.StockAdjustment;
import com.codewithshiva.retailpos.model.StockMovement;
import com.codewithshiva.retailpos.model.SupplierSummary;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Inventory operations.
 */
public interface InventoryDao {

    // ==========================================
    // Inventory Summary - Uses get_inventory_summary() function
    // ==========================================

    @SqlQuery("""
        SELECT total_skus as totalSkus, total_items as totalItems, 
               total_cost_value as totalCostValue, total_retail_value as totalRetailValue,
               low_stock_count as lowStockCount, out_of_stock_count as outOfStockCount
        FROM get_inventory_summary()
        """)
    @RegisterConstructorMapper(InventorySummary.class)
    InventorySummary getInventorySummary();

    // ==========================================
    // Stock Movements - Uses v_stock_movements view
    // ==========================================

    @SqlQuery("""
        SELECT id, variant_id as variantId, movement_type as movementType, 
               movement_date as movementDate, delta_qty as deltaQty,
               reference_id as referenceId, reference_no as referenceNo,
               supplier_name as supplierName, unit_cost as unitCost, 
               notes, created_by as createdBy, created_at as createdAt
        FROM v_stock_movements
        WHERE variant_id = :variantId
        ORDER BY movement_date DESC
        """)
    @RegisterConstructorMapper(StockMovement.class)
    List<StockMovement> findMovementsByVariantId(@Bind("variantId") Long variantId);

    @SqlQuery("""
        SELECT id, variant_id as variantId, movement_type as movementType, 
               movement_date as movementDate, delta_qty as deltaQty,
               reference_id as referenceId, reference_no as referenceNo,
               supplier_name as supplierName, unit_cost as unitCost, 
               notes, created_by as createdBy, created_at as createdAt
        FROM v_stock_movements
        WHERE variant_id = :variantId
          AND (:startDate IS NULL OR movement_date >= :startDate)
          AND (:endDate IS NULL OR movement_date < :endDate)
          AND (:type IS NULL OR movement_type = :type)
        ORDER BY movement_date DESC
        """)
    @RegisterConstructorMapper(StockMovement.class)
    List<StockMovement> findMovementsWithFilters(@Bind("variantId") Long variantId,
                                                  @Bind("startDate") OffsetDateTime startDate,
                                                  @Bind("endDate") OffsetDateTime endDate,
                                                  @Bind("type") String type);

    // ==========================================
    // Supplier Summary for Variant
    // ==========================================

    @SqlQuery("""
        SELECT 
            s.id as supplierId,
            s.name as supplierName,
            SUM(pi.qty)::BIGINT as totalQty,
            COUNT(DISTINCT p.id)::BIGINT as purchaseCount,
            MAX(p.purchased_at) as lastPurchaseDate,
            ROUND(AVG(pi.unit_cost), 2) as avgUnitCost
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pi.variant_id = :variantId
        GROUP BY s.id, s.name
        ORDER BY lastPurchaseDate DESC
        """)
    @RegisterConstructorMapper(SupplierSummary.class)
    List<SupplierSummary> findSupplierSummaryByVariantId(@Bind("variantId") Long variantId);

    // ==========================================
    // Stock Adjustments
    // ==========================================

    @SqlQuery("""
        SELECT id, variant_id as variantId, delta_qty as deltaQty, reason, notes,
               created_by as createdBy, created_at as createdAt
        FROM stock_adjustments
        WHERE id = :id
        """)
    @RegisterConstructorMapper(StockAdjustment.class)
    Optional<StockAdjustment> findAdjustmentById(@Bind("id") Long id);

    @SqlUpdate("""
        INSERT INTO stock_adjustments (variant_id, delta_qty, reason, notes, created_by)
        VALUES (:variantId, :deltaQty, :reason, :notes, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long createAdjustment(@Bind("variantId") Long variantId,
                          @Bind("deltaQty") Integer deltaQty,
                          @Bind("reason") String reason,
                          @Bind("notes") String notes,
                          @Bind("createdBy") Long createdBy);

    // ==========================================
    // Variant Stock Update (for adjustments)
    // ==========================================

    @SqlUpdate("""
        UPDATE variants
        SET stock_qty = stock_qty + :deltaQty
        WHERE id = :variantId
        """)
    void updateVariantStock(@Bind("variantId") Long variantId, @Bind("deltaQty") Integer deltaQty);

    @SqlQuery("""
        SELECT stock_qty FROM variants WHERE id = :variantId
        """)
    Integer getVariantStockQty(@Bind("variantId") Long variantId);
}
