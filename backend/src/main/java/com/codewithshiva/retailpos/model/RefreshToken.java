package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.LocalDateTime;

/**
 * RefreshToken entity representing the refresh_tokens table.
 */
@Data
@Builder
@NoArgsConstructor
public class RefreshToken {
    private Long id;
    private Long userId;
    private String token;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private boolean revoked;

    @ConstructorProperties({"id", "userId", "token", "expiresAt", "createdAt", "lastUsedAt", "revoked"})
    public RefreshToken(Long id, Long userId, String token, LocalDateTime expiresAt, 
                        LocalDateTime createdAt, LocalDateTime lastUsedAt, boolean revoked) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.lastUsedAt = lastUsedAt;
        this.revoked = revoked;
    }
}
