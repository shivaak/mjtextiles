package com.codewithshiva.retailpos.audit;

import com.codewithshiva.retailpos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * AOP Aspect for automatic audit logging.
 * Intercepts methods annotated with @Auditable and logs the action
 * after successful execution.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;

    /**
     * Around advice for methods annotated with @Auditable.
     * Logs the action only after successful method execution.
     * 
     * IMPORTANT: User info and IP address are captured BEFORE the async call
     * because ThreadLocal values are not propagated to async threads.
     */
    @Around("@annotation(auditable)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        // Capture user info and IP address BEFORE method execution (on the main thread)
        // These values won't be available in the async thread
        Long userId = null;
        String username = "anonymous";
        String ipAddress = AuditContext.getIpAddress();
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() 
            && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            userId = userDetails.getUserId();
            username = userDetails.getUsername();
        }
        
        // Execute the actual method
        Object result = joinPoint.proceed();

        // After successful execution, log the audit event with pre-captured context
        try {
            Long entityId = extractEntityId(result, joinPoint);
            String description = buildDescription(auditable, joinPoint, result, entityId);

            auditService.logAsync(
                    auditable.entity(),
                    entityId,
                    auditable.action(),
                    description,
                    userId,
                    username,
                    ipAddress
            );
        } catch (Exception e) {
            // Don't let audit logging failure affect the main flow
            log.error("Failed to log audit event for method {}: {}",
                    joinPoint.getSignature().getName(), e.getMessage());
        }

        return result;
    }

    /**
     * Extract the entity ID from the method result or parameters.
     * Looks for getId() method on the result object, or falls back to
     * looking for an 'id' parameter in the method arguments.
     */
    private Long extractEntityId(Object result, ProceedingJoinPoint joinPoint) {
        // First, try to get ID from result object
        if (result != null) {
            Long id = extractIdFromObject(result);
            if (id != null) {
                return id;
            }
        }

        // Fall back to looking for 'id' in method parameters
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if ("id".equals(parameterNames[i]) && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }

        return null;
    }

    /**
     * Extract ID from an object using reflection.
     * Looks for getId() method.
     */
    private Long extractIdFromObject(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            Method getIdMethod = obj.getClass().getMethod("getId");
            Object idValue = getIdMethod.invoke(obj);
            if (idValue instanceof Long) {
                return (Long) idValue;
            } else if (idValue instanceof Integer) {
                return ((Integer) idValue).longValue();
            }
        } catch (NoSuchMethodException e) {
            // Object doesn't have getId() method - that's fine
            log.trace("Object {} doesn't have getId() method", obj.getClass().getSimpleName());
        } catch (Exception e) {
            log.warn("Failed to extract ID from object: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Build the audit description.
     * Uses the description from the annotation if provided,
     * otherwise generates a default description.
     */
    private String buildDescription(Auditable auditable, ProceedingJoinPoint joinPoint,
                                    Object result, Long entityId) {
        // If annotation has a description, use it
        if (!auditable.description().isEmpty()) {
            return auditable.description();
        }

        // Generate default description
        String methodName = joinPoint.getSignature().getName();
        String entityName = auditable.entity().name().toLowerCase();
        String action = auditable.action().name().toLowerCase();

        // Try to get a meaningful name from the result
        String entityIdentifier = getEntityIdentifier(result, entityId);

        return String.format("%s %s%s via %s",
                capitalize(entityName),
                action,
                entityIdentifier != null ? " " + entityIdentifier : "",
                methodName);
    }

    /**
     * Try to get a meaningful identifier for the entity (like name, billNo, sku, etc.)
     */
    private String getEntityIdentifier(Object result, Long entityId) {
        if (result == null) {
            return entityId != null ? "(ID: " + entityId + ")" : "";
        }

        // Try common identifier methods
        String[] identifierMethods = {"getBillNo", "getSku", "getName", "getUsername"};
        
        for (String methodName : identifierMethods) {
            try {
                Method method = result.getClass().getMethod(methodName);
                Object value = method.invoke(result);
                if (value != null) {
                    return value.toString();
                }
            } catch (NoSuchMethodException e) {
                // Method doesn't exist, try next
            } catch (Exception e) {
                log.trace("Failed to invoke {} on result object", methodName);
            }
        }

        // Fall back to ID
        return entityId != null ? "(ID: " + entityId + ")" : "";
    }

    /**
     * Capitalize the first letter of a string.
     */
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
