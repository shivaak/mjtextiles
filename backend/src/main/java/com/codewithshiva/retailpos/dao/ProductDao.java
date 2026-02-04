package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Product;
import com.codewithshiva.retailpos.model.Variant;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Product operations.
 */
public interface ProductDao {

    // ==========================================
    // Product Queries
    // ==========================================

    @SqlQuery("""
        SELECT id, name, brand, category, hsn, description, is_active as isActive,
               created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM products
        WHERE id = :id
        """)
    @RegisterConstructorMapper(Product.class)
    Optional<Product> findById(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, name, brand, category, hsn, description, is_active as isActive,
               created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM products
        WHERE is_active = true
        ORDER BY updated_at DESC
        """)
    @RegisterConstructorMapper(Product.class)
    List<Product> findAllActive();

    @SqlQuery("""
        SELECT id, name, brand, category, hsn, description, is_active as isActive,
               created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM products
        WHERE is_active = true
          AND (:category IS NULL OR category = :category)
          AND (:brand IS NULL OR brand = :brand)
          AND (:search IS NULL OR (
               to_tsvector('english', name || ' ' || brand || ' ' || category || ' ' || hsn) @@ plainto_tsquery('english', :search)
               OR LOWER(name) LIKE LOWER('%' || :search || '%')
               OR LOWER(brand) LIKE LOWER('%' || :search || '%')
               OR LOWER(category) LIKE LOWER('%' || :search || '%')
               OR LOWER(hsn) LIKE LOWER('%' || :search || '%')
          ))
        ORDER BY updated_at DESC
        """)
    @RegisterConstructorMapper(Product.class)
    List<Product> findWithFilters(@Bind("category") String category,
                                  @Bind("brand") String brand,
                                  @Bind("search") String search);

    @SqlQuery("""
        SELECT p.id, p.name, p.brand, p.category, p.hsn, p.description, p.is_active as isActive,
               p.created_at as createdAt, p.updated_at as updatedAt, p.created_by as createdBy
        FROM products p
        WHERE p.name = :name AND p.brand = :brand
        """)
    @RegisterConstructorMapper(Product.class)
    Optional<Product> findByNameAndBrand(@Bind("name") String name, @Bind("brand") String brand);

    // ==========================================
    // Product Count Queries
    // ==========================================

    @SqlQuery("""
        SELECT COUNT(*) FROM variants WHERE product_id = :productId AND status = 'ACTIVE'
        """)
    int countVariantsByProductId(@Bind("productId") Long productId);

    // ==========================================
    // Product Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO products (name, brand, category, hsn, description, created_by)
        VALUES (:name, :brand, :category, :hsn, :description, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("name") String name,
                @Bind("brand") String brand,
                @Bind("category") String category,
                @Bind("hsn") String hsn,
                @Bind("description") String description,
                @Bind("createdBy") Long createdBy);

    @SqlUpdate("""
        UPDATE products
        SET name = :name,
            brand = :brand,
            category = :category,
            hsn = :hsn,
            description = :description
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("name") String name,
                @Bind("brand") String brand,
                @Bind("category") String category,
                @Bind("hsn") String hsn,
                @Bind("description") String description);

    @SqlUpdate("""
        UPDATE products
        SET is_active = :isActive
        WHERE id = :id
        """)
    void updateStatus(@Bind("id") Long id, @Bind("isActive") boolean isActive);

    // ==========================================
    // Category & Brand Queries
    // ==========================================

    @SqlQuery("""
        SELECT DISTINCT category FROM products
        WHERE is_active = true
        ORDER BY category
        """)
    List<String> findAllCategories();

    @SqlQuery("""
        SELECT DISTINCT brand FROM products
        WHERE is_active = true
        ORDER BY brand
        """)
    List<String> findAllBrands();

    // ==========================================
    // Variant Queries (for Product Detail)
    // ==========================================

    @SqlQuery("""
        SELECT id, product_id as productId, sku, barcode, size, color,
               selling_price as sellingPrice, avg_cost as avgCost, stock_qty as stockQty,
               status, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM variants
        WHERE product_id = :productId
        ORDER BY created_at ASC
        """)
    @RegisterConstructorMapper(Variant.class)
    List<Variant> findVariantsByProductId(@Bind("productId") Long productId);
}
