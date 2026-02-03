package com.codewithshiva.retailpos.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to capture request metadata (like IP address) for audit logging.
 * This filter runs early in the filter chain to ensure the IP is available
 * for all audit operations during the request.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AuditContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            // Capture and set the client IP address
            String ipAddress = getClientIpAddress(request);
            AuditContext.setIpAddress(ipAddress);
            
            filterChain.doFilter(request, response);
        } finally {
            // Always clear the context to prevent memory leaks
            AuditContext.clear();
        }
    }

    /**
     * Extract the client IP address from the request.
     * Handles proxy scenarios by checking X-Forwarded-For header.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        // Check for X-Forwarded-For header (common when behind a proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one (original client)
            return xForwardedFor.split(",")[0].trim();
        }
        
        // Check for X-Real-IP header (used by some proxies)
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        // Fallback to remote address
        return request.getRemoteAddr();
    }
}
