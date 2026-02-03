package com.codewithshiva.retailpos.audit;

/**
 * ThreadLocal holder for audit context metadata like IP address.
 * This is populated by a filter/interceptor at the start of each request.
 */
public class AuditContext {
    
    private static final ThreadLocal<String> ipAddress = new ThreadLocal<>();
    
    /**
     * Set the IP address for the current request.
     */
    public static void setIpAddress(String ip) {
        ipAddress.set(ip);
    }
    
    /**
     * Get the IP address for the current request.
     */
    public static String getIpAddress() {
        return ipAddress.get();
    }
    
    /**
     * Clear the context after request completion.
     */
    public static void clear() {
        ipAddress.remove();
    }
}
