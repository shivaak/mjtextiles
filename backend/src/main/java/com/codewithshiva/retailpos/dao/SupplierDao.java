package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Supplier;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Supplier operations.
 */
@RegisterConstructorMapper(Supplier.class)
public interface SupplierDao {

    // ==========================================
    // Supplier Queries
    // ==========================================

    @SqlQuery("""
        SELECT id, name, phone, email, address, gst_number as gstNumber,
               is_active as isActive, created_at as createdAt, 
               updated_at as updatedAt, created_by as createdBy
        FROM suppliers
        WHERE id = :id
        """)
    Optional<Supplier> findById(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, name, phone, email, address, gst_number as gstNumber,
               is_active as isActive, created_at as createdAt, 
               updated_at as updatedAt, created_by as createdBy
        FROM suppliers
        WHERE is_active = true
        ORDER BY name ASC
        """)
    List<Supplier> findAllActive();

    @SqlQuery("""
        SELECT id, name, phone, email, address, gst_number as gstNumber,
               is_active as isActive, created_at as createdAt, 
               updated_at as updatedAt, created_by as createdBy
        FROM suppliers
        WHERE is_active = true
          AND (
               LOWER(name) LIKE LOWER('%' || :search || '%')
               OR LOWER(phone) LIKE LOWER('%' || :search || '%')
          )
        ORDER BY name ASC
        """)
    List<Supplier> findWithSearch(@Bind("search") String search);

    @SqlQuery("""
        SELECT id, name, phone, email, address, gst_number as gstNumber,
               is_active as isActive, created_at as createdAt, 
               updated_at as updatedAt, created_by as createdBy
        FROM suppliers
        WHERE name = :name
        """)
    Optional<Supplier> findByName(@Bind("name") String name);

    @SqlQuery("""
        SELECT id, name, phone, email, address, gst_number as gstNumber,
               is_active as isActive, created_at as createdAt, 
               updated_at as updatedAt, created_by as createdBy
        FROM suppliers
        WHERE name = :name AND id != :excludeId
        """)
    Optional<Supplier> findByNameExcludingId(@Bind("name") String name, @Bind("excludeId") Long excludeId);

    // ==========================================
    // Supplier Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO suppliers (name, phone, email, address, gst_number, created_by)
        VALUES (:name, :phone, :email, :address, :gstNumber, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("name") String name,
                @Bind("phone") String phone,
                @Bind("email") String email,
                @Bind("address") String address,
                @Bind("gstNumber") String gstNumber,
                @Bind("createdBy") Long createdBy);

    @SqlUpdate("""
        UPDATE suppliers
        SET name = :name,
            phone = :phone,
            email = :email,
            address = :address,
            gst_number = :gstNumber,
            is_active = :isActive
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("name") String name,
                @Bind("phone") String phone,
                @Bind("email") String email,
                @Bind("address") String address,
                @Bind("gstNumber") String gstNumber,
                @Bind("isActive") boolean isActive);
}
