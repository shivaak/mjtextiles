package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.codewithshiva.retailpos.model.SaleWithDetails;
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
 * JDBI DAO for Sale operations.
 */
public interface SaleDao {

    // ==========================================
    // Sale Queries using v_sales_with_details view
    // ==========================================

    @SqlQuery("""
        SELECT id, bill_no as billNo, sold_at as soldAt, customer_name as customerName,
               customer_phone as customerPhone, payment_mode as paymentMode,
               subtotal, discount_percent as discountPercent, discount_amount as discountAmount,
               tax_percent as taxPercent, tax_amount as taxAmount, total, profit, status,
               voided_at as voidedAt, voided_by as voidedBy, void_reason as voidReason,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               created_by_name as createdByName, voided_by_name as voidedByName,
               item_count as itemCount
        FROM v_sales_with_details
        ORDER BY sold_at DESC
        """)
    @RegisterConstructorMapper(SaleWithDetails.class)
    List<SaleWithDetails> findAll();

    @SqlQuery("""
        SELECT id, bill_no as billNo, sold_at as soldAt, customer_name as customerName,
               customer_phone as customerPhone, payment_mode as paymentMode,
               subtotal, discount_percent as discountPercent, discount_amount as discountAmount,
               tax_percent as taxPercent, tax_amount as taxAmount, total, profit, status,
               voided_at as voidedAt, voided_by as voidedBy, void_reason as voidReason,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               created_by_name as createdByName, voided_by_name as voidedByName,
               item_count as itemCount
        FROM v_sales_with_details
        WHERE (:startDate IS NULL OR sold_at >= :startDate)
          AND (:endDate IS NULL OR sold_at < :endDate)
          AND (:paymentMode IS NULL OR payment_mode = :paymentMode)
          AND (:status IS NULL OR status = :status)
          AND (:createdBy IS NULL OR created_by = :createdBy)
          AND (:search IS NULL OR (
               LOWER(bill_no) LIKE LOWER('%' || :search || '%')
               OR LOWER(customer_name) LIKE LOWER('%' || :search || '%')
               OR customer_phone LIKE '%' || :search || '%'
          ))
        ORDER BY sold_at DESC
        """)
    @RegisterConstructorMapper(SaleWithDetails.class)
    List<SaleWithDetails> findWithFilters(@Bind("startDate") OffsetDateTime startDate,
                                          @Bind("endDate") OffsetDateTime endDate,
                                          @Bind("paymentMode") String paymentMode,
                                          @Bind("status") String status,
                                          @Bind("createdBy") Long createdBy,
                                          @Bind("search") String search);

    @SqlQuery("""
        SELECT id, bill_no as billNo, sold_at as soldAt, customer_name as customerName,
               customer_phone as customerPhone, payment_mode as paymentMode,
               subtotal, discount_percent as discountPercent, discount_amount as discountAmount,
               tax_percent as taxPercent, tax_amount as taxAmount, total, profit, status,
               voided_at as voidedAt, voided_by as voidedBy, void_reason as voidReason,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt,
               created_by_name as createdByName, voided_by_name as voidedByName,
               item_count as itemCount
        FROM v_sales_with_details
        WHERE id = :id
        """)
    @RegisterConstructorMapper(SaleWithDetails.class)
    Optional<SaleWithDetails> findByIdWithDetails(@Bind("id") Long id);

    // ==========================================
    // Sale Items Query with Variant/Product info
    // ==========================================

    @SqlQuery("""
        SELECT si.id, si.variant_id as variantId, v.sku as variantSku, 
               v.barcode as variantBarcode, p.name as productName,
               v.size, v.color, si.qty, si.unit_price as unitPrice, 
               si.unit_cost_at_sale as unitCostAtSale
        FROM sale_items si
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE si.sale_id = :saleId
        ORDER BY si.id
        """)
    @RegisterConstructorMapper(SaleItemWithVariant.class)
    List<SaleItemWithVariant> findItemsBySaleId(@Bind("saleId") Long saleId);

    // ==========================================
    // Generate Bill Number Function
    // ==========================================

    @SqlQuery("SELECT generate_bill_number()")
    String generateBillNumber();

    // ==========================================
    // Decrease Stock on Sale Function
    // Returns avg_cost for profit calculation
    // ==========================================

    @SqlQuery("SELECT decrease_variant_stock_on_sale(:variantId, :qty)")
    BigDecimal decreaseVariantStockOnSale(@Bind("variantId") Long variantId, @Bind("qty") Integer qty);

    // ==========================================
    // Restore Stock on Void Function
    // ==========================================

    @SqlUpdate("SELECT restore_stock_on_void(:saleId)")
    void restoreStockOnVoid(@Bind("saleId") Long saleId);

    // ==========================================
    // Get Tax Percent from Settings
    // ==========================================

    @SqlQuery("SELECT tax_percent FROM settings WHERE id = 1")
    BigDecimal getTaxPercent();

    // ==========================================
    // Sale Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO sales (bill_no, sold_at, customer_name, customer_phone, payment_mode,
                          subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
                          total, profit, created_by)
        VALUES (:billNo, :soldAt, :customerName, :customerPhone, :paymentMode,
                :subtotal, :discountPercent, :discountAmount, :taxPercent, :taxAmount,
                :total, :profit, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("billNo") String billNo,
                @Bind("soldAt") OffsetDateTime soldAt,
                @Bind("customerName") String customerName,
                @Bind("customerPhone") String customerPhone,
                @Bind("paymentMode") String paymentMode,
                @Bind("subtotal") BigDecimal subtotal,
                @Bind("discountPercent") BigDecimal discountPercent,
                @Bind("discountAmount") BigDecimal discountAmount,
                @Bind("taxPercent") BigDecimal taxPercent,
                @Bind("taxAmount") BigDecimal taxAmount,
                @Bind("total") BigDecimal total,
                @Bind("profit") BigDecimal profit,
                @Bind("createdBy") Long createdBy);

    // ==========================================
    // Sale Item Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO sale_items (sale_id, variant_id, qty, unit_price, unit_cost_at_sale)
        VALUES (:saleId, :variantId, :qty, :unitPrice, :unitCostAtSale)
        """)
    @GetGeneratedKeys("id")
    Long createItem(@Bind("saleId") Long saleId,
                    @Bind("variantId") Long variantId,
                    @Bind("qty") Integer qty,
                    @Bind("unitPrice") BigDecimal unitPrice,
                    @Bind("unitCostAtSale") BigDecimal unitCostAtSale);

    // ==========================================
    // Void Sale
    // ==========================================

    @SqlUpdate("""
        UPDATE sales
        SET status = 'VOIDED',
            voided_at = :voidedAt,
            voided_by = :voidedBy,
            void_reason = :voidReason
        WHERE id = :id
        """)
    void voidSale(@Bind("id") Long id,
                  @Bind("voidedAt") OffsetDateTime voidedAt,
                  @Bind("voidedBy") Long voidedBy,
                  @Bind("voidReason") String voidReason);

    // ==========================================
    // Get Variant Info for Error Messages
    // ==========================================

    @SqlQuery("SELECT sku FROM variants WHERE id = :variantId")
    String getVariantSku(@Bind("variantId") Long variantId);

    @SqlQuery("SELECT stock_qty FROM variants WHERE id = :variantId")
    Integer getVariantStockQty(@Bind("variantId") Long variantId);
}
