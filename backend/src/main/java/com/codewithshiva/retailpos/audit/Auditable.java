package com.codewithshiva.retailpos.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark service methods for automatic audit logging.
 * When applied to a method, the AuditAspect will automatically log
 * the action after successful execution.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    
    /**
     * The type of entity being audited.
     */
    EntityType entity();
    
    /**
     * The action being performed.
     */
    AuditAction action();
    
    /**
     * Optional description template.
     * Can include placeholders that will be resolved at runtime.
     */
    String description() default "";
}
