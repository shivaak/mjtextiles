package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.User;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

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
}
