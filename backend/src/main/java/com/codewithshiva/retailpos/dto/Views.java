package com.codewithshiva.retailpos.dto;

/**
 * JSON Views for role-based response filtering.
 * Used with @JsonView annotation to control which fields are serialized.
 */
public class Views {
    
    /**
     * Base view - fields visible to all authenticated users (EMPLOYEE and ADMIN).
     */
    public static class Employee {}
    
    /**
     * Admin view - includes sensitive fields like cost and profit.
     * Extends Employee so all Employee fields are also visible.
     */
    public static class Admin extends Employee {}
}
