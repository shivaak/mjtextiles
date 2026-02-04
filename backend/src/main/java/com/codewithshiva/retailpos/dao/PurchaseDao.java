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
        SELECT id, supplierId, invoiceNo,
               purchasedAt, totalCost, notes, status, voidedAt, voidedBy, voidReason,
               createdBy, createdAt, updatedAt,
               supplierName, createdByName, voidedByName,
               itemCount
        FROM v_purchases_with_details
        ORDER BY purchased_at DESC
        """)
    @RegisterConstructorMapper(PurchaseWithDetails.class)
    List<PurchaseWithDetails> findAll();

    @SqlQuery("""
        SELECT id, supplierId, invoiceNo,
               purchasedAt, totalCost, notes, status, voidedAt, voidedBy, voidReason,
               createdBy, createdAt, updatedAt,
               supplierName, createdByName, voidedByName,
               itemCount
        FROM v_purchases_with_details
        WHERE (:supplierId IS NULL OR supplierId = :supplierId)
          AND (:startDate IS NULL OR purchasedAt >= :startDate)
          AND (:endDate IS NULL OR purchasedAt < :endDate)
          AND (
                :search IS NULL
                OR LOWER(invoiceNo) LIKE LOWER('%' || :search || '%')
                OR LOWER(supplierName) LIKE LOWER('%' || :search || '%')
              )
        ORDER BY purchasedAt DESC
        """)
    @RegisterConstructorMapper(PurchaseWithDetails.class)
    List<PurchaseWithDetails> findWithFilters(@Bind("supplierId") Long supplierId,
                                              @Bind("startDate") OffsetDateTime startDate,
                                              @Bind("endDate") OffsetDateTime endDate,
                                              @Bind("search") String search);

    @SqlQuery("""
        SELECT id, supplierId, invoiceNo,
               purchasedAt, totalCost, notes, status, voidedAt, voidedBy, voidReason,
               createdBy, createdAt, updatedAt,
               supplierName, createdByName, voidedByName,
               itemCount
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

    @SqlQuery("""
        SELECT COUNT(*) FROM v_stock_movements
        WHERE variant_id = :variantId
          AND movement_date > :purchasedAt
          AND NOT (movement_type = 'PURCHASE' AND reference_id = :purchaseId)
        """)
    int countSubsequentMovements(@Bind("variantId") Long variantId,
                                 @Bind("purchasedAt") OffsetDateTime purchasedAt,
                                 @Bind("purchaseId") Long purchaseId);

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

    @SqlUpdate("""
        UPDATE purchases
        SET invoice_no = :invoiceNo,
            notes = :notes
        WHERE id = :id
        """)
    void updateMetadata(@Bind("id") Long id,
                        @Bind("invoiceNo") String invoiceNo,
                        @Bind("notes") String notes);

    @SqlUpdate("""
        UPDATE purchases
        SET status = :status,
            voided_at = :voidedAt,
            voided_by = :voidedBy,
            void_reason = :voidReason
        WHERE id = :id
        """)
    void updateStatus(@Bind("id") Long id,
                      @Bind("status") String status,
                      @Bind("voidedAt") OffsetDateTime voidedAt,
                      @Bind("voidedBy") Long voidedBy,
                      @Bind("voidReason") String voidReason);

    @SqlUpdate("""
        UPDATE purchases
        SET total_cost = :totalCost
        WHERE id = :id
        """)
    void updateTotalCost(@Bind("id") Long id, @Bind("totalCost") BigDecimal totalCost);

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

    @SqlUpdate("""
        UPDATE purchase_items
        SET qty = :qty,
            unit_cost = :unitCost
        WHERE id = :id
        """)
    void updateItem(@Bind("id") Long id,
                    @Bind("qty") Integer qty,
                    @Bind("unitCost") BigDecimal unitCost);

    @SqlUpdate("""
        DELETE FROM purchase_items
        WHERE id = :id
        """)
    void deleteItem(@Bind("id") Long id);

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
