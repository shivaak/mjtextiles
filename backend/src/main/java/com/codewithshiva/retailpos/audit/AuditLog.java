package com.codewithshiva.retailpos.audit;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * Model representing an audit log entry.
 */
@Data
@Builder
@NoArgsConstructor
public class AuditLog {
    private Long id;
    private String entityType;
    private Long entityId;
    private String action;
    private Long userId;
    private String username;
    private String description;
    private String ipAddress;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "entityType", "entityId", "action", "userId", "username", 
                           "description", "ipAddress", "createdAt"})
    public AuditLog(Long id, String entityType, Long entityId, String action, Long userId,
                    String username, String description, String ipAddress, OffsetDateTime createdAt) {
        this.id = id;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.userId = userId;
        this.username = username;
        this.description = description;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }
}
