package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Customer;
import com.codewithshiva.retailpos.model.CustomerPointsLog;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for Customer operations.
 */
@RegisterConstructorMapper(Customer.class)
public interface CustomerDao {

    // ==========================================
    // Customer Queries
    // ==========================================

    @SqlQuery("""
        SELECT id, phone, name, area, loyalty_points as loyaltyPoints,
               total_points_earned as totalPointsEarned,
               total_points_redeemed as totalPointsRedeemed,
               created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE id = :id
        """)
    Optional<Customer> findById(@Bind("id") Long id);

    @SqlQuery("""
        SELECT id, phone, name, area, loyalty_points as loyaltyPoints,
               total_points_earned as totalPointsEarned,
               total_points_redeemed as totalPointsRedeemed,
               created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE phone = :phone
        """)
    Optional<Customer> findByPhone(@Bind("phone") String phone);

    @SqlQuery("""
        SELECT id, phone, name, area, loyalty_points as loyaltyPoints,
               total_points_earned as totalPointsEarned,
               total_points_redeemed as totalPointsRedeemed,
               created_at as createdAt, updated_at as updatedAt
        FROM customers
        ORDER BY name ASC
        """)
    List<Customer> findAll();

    @SqlQuery("""
        SELECT id, phone, name, area, loyalty_points as loyaltyPoints,
               total_points_earned as totalPointsEarned,
               total_points_redeemed as totalPointsRedeemed,
               created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE LOWER(name) LIKE LOWER('%' || :search || '%')
           OR phone LIKE '%' || :search || '%'
        ORDER BY name ASC
        """)
    List<Customer> findWithSearch(@Bind("search") String search);

    @SqlQuery("""
        SELECT id, phone, name, area, loyalty_points as loyaltyPoints,
               total_points_earned as totalPointsEarned,
               total_points_redeemed as totalPointsRedeemed,
               created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE phone = :phone AND id != :excludeId
        """)
    Optional<Customer> findByPhoneExcludingId(@Bind("phone") String phone, @Bind("excludeId") Long excludeId);

    // ==========================================
    // Customer Mutations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO customers (phone, name, area)
        VALUES (:phone, :name, :area)
        """)
    @GetGeneratedKeys("id")
    Long create(@Bind("phone") String phone, @Bind("name") String name, @Bind("area") String area);

    @SqlUpdate("""
        UPDATE customers
        SET phone = :phone,
            name = :name,
            area = :area,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("phone") String phone,
                @Bind("name") String name,
                @Bind("area") String area);

    // ==========================================
    // Points Operations
    // ==========================================

    @SqlUpdate("""
        UPDATE customers
        SET loyalty_points = loyalty_points + :points,
            total_points_earned = total_points_earned + :points,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    void addPoints(@Bind("id") Long id, @Bind("points") int points);

    @SqlUpdate("""
        UPDATE customers
        SET loyalty_points = loyalty_points - :points,
            total_points_redeemed = total_points_redeemed + :points,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    void redeemPoints(@Bind("id") Long id, @Bind("points") int points);

    @SqlUpdate("""
        UPDATE customers
        SET loyalty_points = loyalty_points - :points,
            total_points_earned = total_points_earned - :points,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    void reverseEarnedPoints(@Bind("id") Long id, @Bind("points") int points);

    @SqlUpdate("""
        UPDATE customers
        SET loyalty_points = loyalty_points + :points,
            total_points_redeemed = total_points_redeemed - :points,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    void reverseRedeemedPoints(@Bind("id") Long id, @Bind("points") int points);

    // ==========================================
    // Points Log Operations
    // ==========================================

    @SqlUpdate("""
        INSERT INTO customer_points_log (customer_id, sale_id, type, points, description, created_by)
        VALUES (:customerId, :saleId, :type, :points, :description, :createdBy)
        """)
    @GetGeneratedKeys("id")
    Long createPointsLog(@Bind("customerId") Long customerId,
                         @Bind("saleId") Long saleId,
                         @Bind("type") String type,
                         @Bind("points") int points,
                         @Bind("description") String description,
                         @Bind("createdBy") Long createdBy);

    @SqlQuery("""
        SELECT id, customer_id as customerId, sale_id as saleId, type, points,
               description, created_by as createdBy, created_at as createdAt
        FROM customer_points_log
        WHERE customer_id = :customerId
        ORDER BY created_at DESC
        """)
    @RegisterConstructorMapper(CustomerPointsLog.class)
    List<CustomerPointsLog> findPointsLogByCustomerId(@Bind("customerId") Long customerId);
}
