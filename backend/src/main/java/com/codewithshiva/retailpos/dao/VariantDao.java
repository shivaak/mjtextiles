package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Variant;
import com.codewithshiva.retailpos.model.VariantWithProduct;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Variant operations.
 */
public interface VariantDao {

    // ==========================================
    // Variant Queries using v_variants_with_products view
    // ==========================================

    @SqlQuery("""
        SELECT id, product_id as productId, product_name as productName, 
               product_brand as productBrand, product_category as productCategory, product_hsn as productHsn,
               sku, barcode, size, color, selling_price as sellingPrice, 
               avg_cost as avgCost, stock_qty as stockQty, status, 
               created_at as createdAt, updated_at as updatedAt
        FROM v_variants_with_products
        WHERE id = :id
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    Optional<VariantWithProduct> findByIdWithProduct(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, product_id as productId, product_name as productName, 
               product_brand as productBrand, product_category as productCategory, product_hsn as productHsn,
               sku, barcode, size, color, selling_price as sellingPrice, 
               avg_cost as avgCost, stock_qty as stockQty, status, 
               created_at as createdAt, updated_at as updatedAt
        FROM v_variants_with_products
        WHERE barcode = :barcode
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    Optional<VariantWithProduct> findByBarcodeWithProduct(@Bind("barcode") String barcode);

    @SqlQuery("""
        SELECT id, product_id as productId, product_name as productName, 
               product_brand as productBrand, product_category as productCategory, product_hsn as productHsn,
               sku, barcode, size, color, selling_price as sellingPrice, 
               avg_cost as avgCost, stock_qty as stockQty, status, 
               created_at as createdAt, updated_at as updatedAt
        FROM v_variants_with_products
        WHERE (:productId IS NULL OR product_id = :productId)
          AND (:category IS NULL OR product_category = :category)
          AND (:brand IS NULL OR product_brand = :brand)
          AND (:status IS NULL OR status = :status)
          AND (:search IS NULL OR (
               LOWER(sku) LIKE LOWER('%' || :search || '%')
               OR LOWER(barcode) LIKE LOWER('%' || :search || '%')
               OR LOWER(product_name) LIKE LOWER('%' || :search || '%')
               OR LOWER(product_hsn) LIKE LOWER('%' || :search || '%')
          ))
        ORDER BY updated_at DESC
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    List<VariantWithProduct> findWithFilters(@Bind("productId") Long productId,
                                             @Bind("category") String category,
                                             @Bind("brand") String brand,
                                             @Bind("status") String status,
                                             @Bind("search") String search);

    // ==========================================
    // Low Stock & Out of Stock Queries
    // ==========================================

    @SqlQuery("""
        SELECT v.id, v.product_id as productId, p.name as productName, 
               p.brand as productBrand, p.category as productCategory, p.hsn as productHsn,
               v.sku, v.barcode, v.size, v.color, v.selling_price as sellingPrice, 
               v.avg_cost as avgCost, v.stock_qty as stockQty, v.status, 
               v.created_at as createdAt, v.updated_at as updatedAt
        FROM v_low_stock_variants v
        JOIN products p ON v.product_id = p.id
        WHERE (:productId IS NULL OR v.product_id = :productId)
          AND (:category IS NULL OR p.category = :category)
          AND (:brand IS NULL OR p.brand = :brand)
          AND (:status IS NULL OR v.status = :status)
          AND (:search IS NULL OR (
               LOWER(v.sku) LIKE LOWER('%' || :search || '%')
               OR LOWER(v.barcode) LIKE LOWER('%' || :search || '%')
               OR LOWER(p.name) LIKE LOWER('%' || :search || '%')
               OR LOWER(p.hsn) LIKE LOWER('%' || :search || '%')
          ))
        ORDER BY v.stock_qty ASC
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    List<VariantWithProduct> findLowStock(@Bind("productId") Long productId,
                                          @Bind("category") String category,
                                          @Bind("brand") String brand,
                                          @Bind("status") String status,
                                          @Bind("search") String search);

    @SqlQuery("""
        SELECT id, product_id as productId, product_name as productName, 
               product_brand as productBrand, product_category as productCategory, product_hsn as productHsn,
               sku, barcode, size, color, selling_price as sellingPrice, 
               avg_cost as avgCost, stock_qty as stockQty, status, 
               created_at as createdAt, updated_at as updatedAt
        FROM v_variants_with_products
        WHERE stock_qty = 0
          AND (:productId IS NULL OR product_id = :productId)
          AND (:category IS NULL OR product_category = :category)
          AND (:brand IS NULL OR product_brand = :brand)
          AND (:status IS NULL OR status = :status)
          AND (:search IS NULL OR (
               LOWER(sku) LIKE LOWER('%' || :search || '%')
               OR LOWER(barcode) LIKE LOWER('%' || :search || '%')
               OR LOWER(product_name) LIKE LOWER('%' || :search || '%')
               OR LOWER(product_hsn) LIKE LOWER('%' || :search || '%')
          ))
        ORDER BY updated_at DESC
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    List<VariantWithProduct> findOutOfStock(@Bind("productId") Long productId,
                                            @Bind("category") String category,
                                            @Bind("brand") String brand,
                                            @Bind("status") String status,
                                            @Bind("search") String search);

    // ==========================================
    // Search for POS autocomplete
    // ==========================================

    @SqlQuery("""
        SELECT id, product_id as productId, product_name as productName, 
               product_brand as productBrand, product_category as productCategory, product_hsn as productHsn,
               sku, barcode, size, color, selling_price as sellingPrice, 
               avg_cost as avgCost, stock_qty as stockQty, status, 
               created_at as createdAt, updated_at as updatedAt
        FROM v_variants_with_products
        WHERE status = 'ACTIVE'
          AND (
               LOWER(sku) LIKE LOWER('%' || :query || '%')
               OR LOWER(barcode) LIKE LOWER('%' || :query || '%')
               OR LOWER(product_name) LIKE LOWER('%' || :query || '%')
               OR LOWER(product_hsn) LIKE LOWER('%' || :query || '%')
          )
        ORDER BY 
            CASE WHEN LOWER(barcode) = LOWER(:query) THEN 0
                 WHEN LOWER(sku) = LOWER(:query) THEN 1
                 ELSE 2 END,
            product_name ASC
        LIMIT :limit
        """)
    @RegisterConstructorMapper(VariantWithProduct.class)
    List<VariantWithProduct> search(@Bind("query") String query, @Bind("limit") int limit);

    // ==========================================
    // Duplicate Checking Queries
    // ==========================================

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE sku = :sku
        """)
    @RegisterConstructorMapper(Variant.class)
    Optional<Variant> findBySku(@Bind("sku") String sku);

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE barcode = :barcode
        """)
    @RegisterConstructorMapper(Variant.class)
    Optional<Variant> findByBarcode(@Bind("barcode") String barcode);

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE sku = :sku AND id != :excludeId
        """)
    @RegisterConstructorMapper(Variant.class)
    Optional<Variant> findBySkuExcludingId(@Bind("sku") String sku, @Bind("excludeId") Long excludeId);

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE barcode = :barcode AND id != :excludeId
        """)
    @RegisterConstructorMapper(Variant.class)
    Optional<Variant> findByBarcodeExcludingId(@Bind("barcode") String barcode, @Bind("excludeId") Long excludeId);

    // ==========================================
    // Variant Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO variants (product_id, sku, barcode, size, color, selling_price, avg_cost, created_by)
        VALUES (:productId, :sku, :barcode, :size, :color, :sellingPrice, :avgCost, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("productId") Long productId,
                @Bind("sku") String sku,
                @Bind("barcode") String barcode,
                @Bind("size") String size,
                @Bind("color") String color,
                @Bind("sellingPrice") BigDecimal sellingPrice,
                @Bind("avgCost") BigDecimal avgCost,
                @Bind("createdBy") Long createdBy);

    @SqlUpdate("""
        UPDATE variants
        SET sku = :sku,
            barcode = :barcode,
            size = :size,
            color = :color,
            selling_price = :sellingPrice,
            avg_cost = :avgCost
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("sku") String sku,
                @Bind("barcode") String barcode,
                @Bind("size") String size,
                @Bind("color") String color,
                @Bind("sellingPrice") BigDecimal sellingPrice,
                @Bind("avgCost") BigDecimal avgCost);

    @SqlUpdate("""
        UPDATE variants
        SET status = :status
        WHERE id = :id
        """)
    void updateStatus(@Bind("id") Long id, @Bind("status") String status);

    // ==========================================
    // Basic Variant Query (for existence check)
    // ==========================================

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE id = :id
        """)
    @RegisterConstructorMapper(Variant.class)
    Optional<Variant> findById(@Bind("id") Long id);
}
