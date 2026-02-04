package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.User;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.sqlobject.customizer.BindList;

import java.util.List;
import java.util.Optional;

/**
 * JDBI DAO for User operations.
 */
@RegisterConstructorMapper(User.class)
public interface UserDao {

    @SqlQuery("""
        SELECT id, username, password_hash as passwordHash, full_name as fullName,
               role, is_active as isActive, created_at as createdAt,
               updated_at as updatedAt, last_login_at as lastLoginAt
        FROM users
        WHERE username = :username
        """)
    Optional<User> findByUsername(@Bind("username") String username);

    @SqlQuery("""
        SELECT id, username, password_hash as passwordHash, full_name as fullName,
               role, is_active as isActive, created_at as createdAt,
               updated_at as updatedAt, last_login_at as lastLoginAt
        FROM users
        WHERE id = :id
        """)
    Optional<User> findById(@Bind("id") Long id);

    @SqlUpdate("""
        UPDATE users
        SET last_login_at = NOW()
        WHERE id = :id
        """)
    void updateLastLogin(@Bind("id") Long id);

    @SqlUpdate("""
        UPDATE users
        SET password_hash = :passwordHash
        WHERE id = :id
        """)
    void updatePassword(@Bind("id") Long id, @Bind("passwordHash") String passwordHash);

    @SqlUpdate("""
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES (:username, :passwordHash, :fullName, :role)
        """)
    void create(@Bind("username") String username, 
                @Bind("passwordHash") String passwordHash,
                @Bind("fullName") String fullName, 
                @Bind("role") String role);

    @SqlUpdate("""
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES (:username, :passwordHash, :fullName, :role)
        """)
    @GetGeneratedKeys("id")
    Long createReturningId(@Bind("username") String username,
                           @Bind("passwordHash") String passwordHash,
                           @Bind("fullName") String fullName,
                           @Bind("role") String role);

    @SqlQuery("""
        SELECT id, username, password_hash as passwordHash, full_name as fullName,
               role, is_active as isActive, created_at as createdAt,
               updated_at as updatedAt, last_login_at as lastLoginAt
        FROM users
        ORDER BY created_at DESC
        """)
    List<User> findAll();

    @SqlQuery("""
        SELECT id, username, password_hash as passwordHash, full_name as fullName,
               role, is_active as isActive, created_at as createdAt,
               updated_at as updatedAt, last_login_at as lastLoginAt
        FROM users
        WHERE (:role IS NULL OR role = :role)
          AND (:isActive IS NULL OR is_active = :isActive)
          AND (:search IS NULL OR (
               LOWER(username) LIKE LOWER('%' || :search || '%') OR
               LOWER(full_name) LIKE LOWER('%' || :search || '%')
          ))
        ORDER BY created_at DESC
        """)
    List<User> findWithFilters(@Bind("role") String role,
                               @Bind("isActive") Boolean isActive,
                               @Bind("search") String search);

    @SqlQuery("""
        SELECT id, username, password_hash as passwordHash, full_name as fullName,
               role, is_active as isActive, created_at as createdAt,
               updated_at as updatedAt, last_login_at as lastLoginAt
        FROM users
        WHERE role IN (<roles>)
        ORDER BY created_at DESC
        """)
    List<User> findByRoles(@BindList("roles") List<String> roles);

    @SqlUpdate("""
        UPDATE users
        SET full_name = :fullName,
            role = :role,
            is_active = :isActive
        WHERE id = :id
        """)
    void update(@Bind("id") Long id,
                @Bind("fullName") String fullName,
                @Bind("role") String role,
                @Bind("isActive") Boolean isActive);

    @SqlUpdate("""
        UPDATE users
        SET is_active = :isActive
        WHERE id = :id
        """)
    void updateStatus(@Bind("id") Long id, @Bind("isActive") Boolean isActive);
}
