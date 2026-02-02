package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.RefreshToken;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.Optional;

/**
 * JDBI DAO for RefreshToken operations.
 */
@RegisterConstructorMapper(RefreshToken.class)
public interface RefreshTokenDao {

    @SqlUpdate("""
        INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, last_used_at, revoked)
        VALUES (:userId, :token, :expiresAt, datetime('now', 'localtime'), datetime('now', 'localtime'), 0)
        """)
    void save(@Bind("userId") Long userId, @Bind("token") String token, @Bind("expiresAt") String expiresAt);

    @SqlQuery("""
        SELECT id, user_id as userId, token, expires_at as expiresAt,
               created_at as createdAt, last_used_at as lastUsedAt, revoked
        FROM refresh_tokens
        WHERE token = :token AND revoked = 0
        """)
    Optional<RefreshToken> findByToken(@Bind("token") String token);

    @SqlUpdate("""
        UPDATE refresh_tokens
        SET last_used_at = datetime('now', 'localtime')
        WHERE token = :token
        """)
    void updateLastUsedAt(@Bind("token") String token);

    @SqlUpdate("""
        UPDATE refresh_tokens
        SET revoked = 1
        WHERE token = :token
        """)
    void revokeByToken(@Bind("token") String token);

    @SqlUpdate("""
        UPDATE refresh_tokens
        SET revoked = 1
        WHERE user_id = :userId AND revoked = 0
        """)
    void revokeAllByUserId(@Bind("userId") Long userId);

    @SqlUpdate("""
        DELETE FROM refresh_tokens
        WHERE expires_at < datetime('now', 'localtime') OR revoked = 1
        """)
    int deleteExpiredAndRevokedTokens();
}
