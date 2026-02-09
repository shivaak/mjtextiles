package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Offer;
import com.codewithshiva.retailpos.model.OfferItem;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Offer operations.
 */
public interface OfferDao {

    // ==========================================
    // Offer Queries
    // ==========================================

    @SqlQuery("""
        SELECT id, name, offer_type as offerType, is_active as isActive,
               start_date as startDate, end_date as endDate,
               combo_price as comboPrice, buy_qty as buyQty, free_qty as freeQty, priority,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM offers
        ORDER BY priority DESC, created_at DESC
        """)
    @RegisterConstructorMapper(Offer.class)
    List<Offer> findAll();

    @SqlQuery("""
        SELECT id, name, offer_type as offerType, is_active as isActive,
               start_date as startDate, end_date as endDate,
               combo_price as comboPrice, buy_qty as buyQty, free_qty as freeQty, priority,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM offers
        WHERE id = :id
        """)
    @RegisterConstructorMapper(Offer.class)
    Optional<Offer> findById(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, name, offer_type as offerType, is_active as isActive,
               start_date as startDate, end_date as endDate,
               combo_price as comboPrice, buy_qty as buyQty, free_qty as freeQty, priority,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM offers
        WHERE is_active = true
          AND (start_date IS NULL OR start_date <= CURRENT_DATE)
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY priority DESC, created_at DESC
        """)
    @RegisterConstructorMapper(Offer.class)
    List<Offer> findActiveOffers();

    // ==========================================
    // Offer Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO offers (name, offer_type, is_active, start_date, end_date, combo_price, buy_qty, free_qty, priority, created_by)
        VALUES (:name, :offerType, :isActive, :startDate, :endDate, :comboPrice, :buyQty, :freeQty, :priority, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("name") String name,
                @Bind("offerType") String offerType,
                @Bind("isActive") boolean isActive,
                @Bind("startDate") LocalDate startDate,
                @Bind("endDate") LocalDate endDate,
                @Bind("comboPrice") BigDecimal comboPrice,
                @Bind("buyQty") Integer buyQty,
                @Bind("freeQty") Integer freeQty,
                @Bind("priority") Integer priority,
                @Bind("createdBy") Long createdBy);

    @SqlUpdate("""
        UPDATE offers
        SET name = :name,
            offer_type = :offerType,
            is_active = :isActive,
            start_date = :startDate,
            end_date = :endDate,
            combo_price = :comboPrice,
            buy_qty = :buyQty,
            free_qty = :freeQty,
            priority = :priority
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("name") String name,
                @Bind("offerType") String offerType,
                @Bind("isActive") boolean isActive,
                @Bind("startDate") LocalDate startDate,
                @Bind("endDate") LocalDate endDate,
                @Bind("comboPrice") BigDecimal comboPrice,
                @Bind("buyQty") Integer buyQty,
                @Bind("freeQty") Integer freeQty,
                @Bind("priority") Integer priority);

    @SqlUpdate("UPDATE offers SET is_active = :isActive WHERE id = :id")
    void updateActiveStatus(@Bind("id") Long id, @Bind("isActive") boolean isActive);

    @SqlUpdate("DELETE FROM offers WHERE id = :id")
    void deleteById(@Bind("id") Long id);

    // ==========================================
    // Offer Item Queries
    // ==========================================

    @SqlQuery("""
        SELECT oi.id, oi.offer_id as offerId, oi.product_id as productId, oi.variant_id as variantId,
               oi.min_qty as minQty, oi.offer_price as offerPrice,
               oi.discount_percent as discountPercent, oi.free_qty as freeQty,
               COALESCE(p.name, vp.name) as productName, v.sku as variantSku,
               v.product_id as variantProductId
        FROM offer_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN variants v ON oi.variant_id = v.id
        LEFT JOIN products vp ON v.product_id = vp.id
        WHERE oi.offer_id = :offerId
        """)
    @RegisterConstructorMapper(OfferItem.class)
    List<OfferItem> findItemsByOfferId(@Bind("offerId") Long offerId);

    // ==========================================
    // Offer Item Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO offer_items (offer_id, product_id, variant_id, min_qty, offer_price, discount_percent, free_qty)
        VALUES (:offerId, :productId, :variantId, :minQty, :offerPrice, :discountPercent, :freeQty)
        """)
    @GetGeneratedKeys("id")
    Long createItem(@Bind("offerId") Long offerId,
                    @Bind("productId") Long productId,
                    @Bind("variantId") Long variantId,
                    @Bind("minQty") Integer minQty,
                    @Bind("offerPrice") BigDecimal offerPrice,
                    @Bind("discountPercent") BigDecimal discountPercent,
                    @Bind("freeQty") Integer freeQty);

    @SqlUpdate("DELETE FROM offer_items WHERE offer_id = :offerId")
    void deleteItemsByOfferId(@Bind("offerId") Long offerId);
}
