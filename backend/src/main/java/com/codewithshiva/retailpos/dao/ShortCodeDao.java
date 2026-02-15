package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.ShortCode;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for ShortCode operations.
 */
public interface ShortCodeDao {

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE type = :type
        ORDER BY name
        """)
    @RegisterConstructorMapper(ShortCode.class)
    List<ShortCode> findByType(@Bind("type") String type);

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        ORDER BY type, name
        """)
    @RegisterConstructorMapper(ShortCode.class)
    List<ShortCode> findAll();

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE type = :type AND name = :name
        """)
    @RegisterConstructorMapper(ShortCode.class)
    Optional<ShortCode> findByTypeAndName(@Bind("type") String type, @Bind("name") String name);

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE type = :type AND short_code = :shortCode
        """)
    @RegisterConstructorMapper(ShortCode.class)
    Optional<ShortCode> findByTypeAndShortCode(@Bind("type") String type, @Bind("shortCode") String shortCode);

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE id = :id
        """)
    @RegisterConstructorMapper(ShortCode.class)
    Optional<ShortCode> findById(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE type = :type AND name = :name AND id != :excludeId
        """)
    @RegisterConstructorMapper(ShortCode.class)
    Optional<ShortCode> findByTypeAndNameExcludingId(@Bind("type") String type,
                                                      @Bind("name") String name,
                                                      @Bind("excludeId") Long excludeId);

    @SqlQuery("""
        SELECT id, type, name, short_code as shortCode, created_at as createdAt
        FROM short_codes
        WHERE type = :type AND short_code = :shortCode AND id != :excludeId
        """)
    @RegisterConstructorMapper(ShortCode.class)
    Optional<ShortCode> findByTypeAndShortCodeExcludingId(@Bind("type") String type,
                                                           @Bind("shortCode") String shortCode,
                                                           @Bind("excludeId") Long excludeId);

    // In-use count queries for delete validation
    @SqlQuery("SELECT COUNT(*) FROM products WHERE category = :name")
    int countProductsByCategory(@Bind("name") String name);

    @SqlQuery("SELECT COUNT(*) FROM products WHERE brand = :name")
    int countProductsByBrand(@Bind("name") String name);

    @SqlQuery("SELECT COUNT(*) FROM variants WHERE fabric = :name")
    int countVariantsByFabric(@Bind("name") String name);

    @SqlQuery("SELECT COUNT(*) FROM variants WHERE size = :name")
    int countVariantsBySize(@Bind("name") String name);

    @SqlQuery("SELECT COUNT(*) FROM variants WHERE color = :name")
    int countVariantsByColor(@Bind("name") String name);

    @SqlQuery("SELECT COUNT(*) FROM variants WHERE variant_type = :name")
    int countVariantsByVariantType(@Bind("name") String name);

    @SqlUpdate("""
        INSERT INTO short_codes (type, name, short_code)
        VALUES (:type, :name, :shortCode)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("type") String type,
                @Bind("name") String name,
                @Bind("shortCode") String shortCode);

    @SqlUpdate("""
        UPDATE short_codes
        SET name = :name, short_code = :shortCode
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("name") String name,
                @Bind("shortCode") String shortCode);

    @SqlUpdate("""
        DELETE FROM short_codes WHERE id = :id
        """)
    void delete(@Bind("id") Long id);
}
