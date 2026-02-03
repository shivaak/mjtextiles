package com.codewithshiva.retailpos.audit;

/**
 * Enum representing the types of actions that can be audited.
 */
public enum AuditAction {
    // CRUD operations
    CREATE,
    UPDATE,
    DELETE,
    STATUS_CHANGE,
    
    // Authentication operations
    LOGIN,
    LOGIN_FAILED,
    LOGOUT,
    PASSWORD_CHANGE,
    
    // Business-specific operations
    VOID,
    ADJUSTMENT
}
