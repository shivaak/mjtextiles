package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.LocalDateTime;

/**
 * User entity representing the users table.
 */
@Data
@Builder
@NoArgsConstructor
public class User {
    private Long id;
    private String username;
    private String passwordHash;
    private String fullName;
    private Role role;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;

    @ConstructorProperties({"id", "username", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt", "lastLoginAt"})
    public User(Long id, String username, String passwordHash, String fullName, Role role, 
                boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime lastLoginAt) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLoginAt = lastLoginAt;
    }
}
