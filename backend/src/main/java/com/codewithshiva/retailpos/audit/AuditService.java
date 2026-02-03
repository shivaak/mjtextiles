package com.codewithshiva.retailpos.audit;

import com.codewithshiva.retailpos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service for logging audit events.
 * Provides both synchronous and asynchronous logging methods.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditDao auditDao;

    /**
     * Log an audit event asynchronously with pre-captured user info and IP.
     * This is the primary method for AOP-based auditing where context must be captured
     * before the async call.
     *
     * @param entityType  The type of entity being audited
     * @param entityId    The ID of the entity (can be null for some operations)
     * @param action      The action being performed
     * @param description A human-readable description of the action
     * @param userId      The user ID (captured from SecurityContext before async call)
     * @param username    The username (captured from SecurityContext before async call)
     * @param ipAddress   The client IP address (captured from AuditContext before async call)
     */
    @Async
    public void logAsync(EntityType entityType, Long entityId, AuditAction action, 
                         String description, Long userId, String username, String ipAddress) {
        try {
            auditDao.insert(
                    entityType.name(),
                    entityId,
                    action.name(),
                    userId,
                    username,
                    description,
                    ipAddress
            );

            log.debug("Audit log created: {} {} on {} (ID: {})",
                    username, action, entityType, entityId);
        } catch (Exception e) {
            // Log the error but don't throw - audit logging should not break the main flow
            log.error("Failed to create audit log: {} {} on {} (ID: {})",
                    action, entityType, entityId, e.getMessage());
        }
    }

    /**
     * Log an audit event synchronously.
     * Use this when you need to ensure the audit log is created before proceeding.
     *
     * @param entityType  The type of entity being audited
     * @param entityId    The ID of the entity (can be null for some operations)
     * @param action      The action being performed
     * @param description A human-readable description of the action
     */
    public void log(EntityType entityType, Long entityId, AuditAction action, String description) {
        try {
            UserInfo userInfo = getCurrentUserInfo();
            String ipAddress = AuditContext.getIpAddress();

            auditDao.insert(
                    entityType.name(),
                    entityId,
                    action.name(),
                    userInfo.userId(),
                    userInfo.username(),
                    description,
                    ipAddress
            );

            log.debug("Audit log created (sync): {} {} on {} (ID: {})",
                    userInfo.username(), action, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to create audit log: {} {} on {} (ID: {})",
                    action, entityType, entityId, e.getMessage());
        }
    }

    /**
     * Log an authentication event.
     * This is used for login, logout, and failed login attempts.
     *
     * @param action      The authentication action (LOGIN, LOGOUT, LOGIN_FAILED)
     * @param username    The username involved in the action
     * @param description A description of the event
     */
    public void logAuth(AuditAction action, String username, String description) {
        try {
            Long userId = null;
            
            // For successful login/logout, try to get the user ID from context
            if (action == AuditAction.LOGIN || action == AuditAction.LOGOUT || 
                action == AuditAction.PASSWORD_CHANGE) {
                UserInfo userInfo = getCurrentUserInfo();
                userId = userInfo.userId();
                if (username == null) {
                    username = userInfo.username();
                }
            }

            String ipAddress = AuditContext.getIpAddress();

            auditDao.insert(
                    EntityType.USER.name(),
                    userId,  // Entity ID is the user ID for auth events
                    action.name(),
                    userId,
                    username,
                    description,
                    ipAddress
            );

            log.debug("Auth audit log created: {} for user {}", action, username);
        } catch (Exception e) {
            log.error("Failed to create auth audit log: {} for user {}: {}",
                    action, username, e.getMessage());
        }
    }

    /**
     * Log an authentication event with explicit user ID.
     * Used when the user ID is known (e.g., after successful authentication).
     *
     * @param action      The authentication action
     * @param userId      The user ID
     * @param username    The username
     * @param description A description of the event
     */
    public void logAuthWithUserId(AuditAction action, Long userId, String username, String description) {
        try {
            String ipAddress = AuditContext.getIpAddress();

            auditDao.insert(
                    EntityType.USER.name(),
                    userId,
                    action.name(),
                    userId,
                    username,
                    description,
                    ipAddress
            );

            log.debug("Auth audit log created: {} for user {} (ID: {})", action, username, userId);
        } catch (Exception e) {
            log.error("Failed to create auth audit log: {} for user {}: {}",
                    action, username, e.getMessage());
        }
    }

    /**
     * Get the current authenticated user's information from the security context.
     */
    private UserInfo getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() 
            && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return new UserInfo(userDetails.getUserId(), userDetails.getUsername());
        }
        
        return new UserInfo(null, "anonymous");
    }

    /**
     * Internal record to hold user information.
     */
    private record UserInfo(Long userId, String username) {}
}
