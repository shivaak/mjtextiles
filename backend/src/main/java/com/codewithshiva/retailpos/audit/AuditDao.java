package com.codewithshiva.retailpos.audit;

import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;

/**
 * JDBI DAO for Audit Log operations.
 */
@RegisterConstructorMapper(AuditLog.class)
public interface AuditDao {

    /**
     * Insert a new audit log entry.
     */
    @SqlUpdate("""
        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, username, description, ip_address)
        VALUES (:entityType, :entityId, :action, :userId, :username, :description, :ipAddress)
        """)
    @GetGeneratedKeys("id")
    Long insert(@Bind("entityType") String entityType,
                @Bind("entityId") Long entityId,
                @Bind("action") String action,
                @Bind("userId") Long userId,
                @Bind("username") String username,
                @Bind("description") String description,
                @Bind("ipAddress") String ipAddress);

    /**
     * Find audit logs by entity type and entity ID.
     */
    @SqlQuery("""
        SELECT id, entity_type as entityType, entity_id as entityId, action,
               user_id as userId, username, description, ip_address as ipAddress,
               created_at as createdAt
        FROM audit_logs
        WHERE entity_type = :entityType AND entity_id = :entityId
        ORDER BY created_at DESC
        """)
    List<AuditLog> findByEntity(@Bind("entityType") String entityType,
                                @Bind("entityId") Long entityId);

    /**
     * Find audit logs by user ID.
     */
    @SqlQuery("""
        SELECT id, entity_type as entityType, entity_id as entityId, action,
               user_id as userId, username, description, ip_address as ipAddress,
               created_at as createdAt
        FROM audit_logs
        WHERE user_id = :userId
        ORDER BY created_at DESC
        LIMIT :limit
        """)
    List<AuditLog> findByUserId(@Bind("userId") Long userId, @Bind("limit") int limit);

    /**
     * Find recent audit logs.
     */
    @SqlQuery("""
        SELECT id, entity_type as entityType, entity_id as entityId, action,
               user_id as userId, username, description, ip_address as ipAddress,
               created_at as createdAt
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT :limit
        """)
    List<AuditLog> findRecent(@Bind("limit") int limit);

    /**
     * Find audit logs by action type.
     */
    @SqlQuery("""
        SELECT id, entity_type as entityType, entity_id as entityId, action,
               user_id as userId, username, description, ip_address as ipAddress,
               created_at as createdAt
        FROM audit_logs
        WHERE action = :action
        ORDER BY created_at DESC
        LIMIT :limit
        """)
    List<AuditLog> findByAction(@Bind("action") String action, @Bind("limit") int limit);
}
