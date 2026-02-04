package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.PurchaseItemWithVariant;
import com.codewithshiva.retailpos.model.PurchaseWithDetails;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Purchase operations.
 */
public interface PurchaseDao {

    // ==========================================
    // Purchase Queries using v_purchases_with_details view
    // ==========================================

    @SqlQuery("""
        SELECT id, supplier_id as supplierId, invoice_no as invoiceNo, 
               purchased_at as purchasedAt, total_cost as totalCost, notes,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               supplier_name as supplierName, created_by_name as createdByName, 
               item_count as itemCount
        FROM v_purchases_with_details
        ORDER BY purchased_at DESC
        """)
    @RegisterConstructorMapper(PurchaseWithDetails.class)
    List<PurchaseWithDetails> findAll();

    @SqlQuery("""
        SELECT id, supplier_id as supplierId, invoice_no as invoiceNo, 
               purchased_at as purchasedAt, total_cost as totalCost, notes,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               supplier_name as supplierName, created_by_name as createdByName, 
               item_count as itemCount
        FROM v_purchases_with_details
        WHERE (:supplierId IS NULL OR supplier_id = :supplierId)
          AND (:startDate IS NULL OR purchased_at >= :startDate)
          AND (:endDate IS NULL OR purchased_at < :endDate)
          AND (
                :search IS NULL
                OR LOWER(invoice_no) LIKE LOWER('%' || :search || '%')
                OR LOWER(supplier_name) LIKE LOWER('%' || :search || '%')
              )
        ORDER BY purchased_at DESC
        """)
    @RegisterConstructorMapper(PurchaseWithDetails.class)
    List<PurchaseWithDetails> findWithFilters(@Bind("supplierId") Long supplierId,
                                              @Bind("startDate") OffsetDateTime startDate,
                                              @Bind("endDate") OffsetDateTime endDate,
                                              @Bind("search") String search);

    @SqlQuery("""
        SELECT id, supplier_id as supplierId, invoice_no as invoiceNo, 
               purchased_at as purchasedAt, total_cost as totalCost, notes,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               supplier_name as supplierName, created_by_name as createdByName, 
               item_count as itemCount
        FROM v_purchases_with_details
        WHERE id = :id
        """)
    @RegisterConstructorMapper(PurchaseWithDetails.class)
    Optional<PurchaseWithDetails> findByIdWithDetails(@Bind("id") Long id);

    // ==========================================
    // Purchase Items Query with Variant/Product info
    // ==========================================

    @SqlQuery("""
        SELECT pi.id, pi.variant_id as variantId, v.sku as variantSku, 
               v.barcode as variantBarcode, p.name as productName,
               v.size, v.color, pi.qty, pi.unit_cost as unitCost
        FROM purchase_items pi
        JOIN variants v ON pi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE pi.purchase_id = :purchaseId
        ORDER BY pi.id
        """)
    @RegisterConstructorMapper(PurchaseItemWithVariant.class)
    List<PurchaseItemWithVariant> findItemsByPurchaseId(@Bind("purchaseId") Long purchaseId);

    // ==========================================
    // Purchase Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO purchases (supplier_id, invoice_no, purchased_at, total_cost, notes, created_by)
        VALUES (:supplierId, :invoiceNo, :purchasedAt, :totalCost, :notes, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("supplierId") Long supplierId,
                @Bind("invoiceNo") String invoiceNo,
                @Bind("purchasedAt") OffsetDateTime purchasedAt,
                @Bind("totalCost") BigDecimal totalCost,
                @Bind("notes") String notes,
                @Bind("createdBy") Long createdBy);

    // ==========================================
    // Purchase Item Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO purchase_items (purchase_id, variant_id, qty, unit_cost)
        VALUES (:purchaseId, :variantId, :qty, :unitCost)
        """)
    @GetGeneratedKeys("id")
    Long createItem(@Bind("purchaseId") Long purchaseId,
                    @Bind("variantId") Long variantId,
                    @Bind("qty") Integer qty,
                    @Bind("unitCost") BigDecimal unitCost);

    // ==========================================
    // Stock Update Function Call
    // ==========================================

    /**
     * Calls the PostgreSQL function to update variant stock on purchase.
     * This function:
     * - Calculates weighted average cost
     * - Updates stock_qty and avg_cost atomically
     * - Uses FOR UPDATE row locking
     */
    @SqlUpdate("SELECT update_variant_stock_on_purchase(:variantId, :qty, :unitCost)")
    void updateVariantStockOnPurchase(@Bind("variantId") Long variantId,
                                      @Bind("qty") Integer qty,
                                      @Bind("unitCost") BigDecimal unitCost);
}
