package com.codewithshiva.retailpos.config;

import com.codewithshiva.retailpos.dto.Views;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJacksonValue;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.AbstractMappingJacksonResponseBodyAdvice;

/**
 * ResponseBodyAdvice that automatically applies the appropriate JsonView
 * based on the authenticated user's role.
 * 
 * - ADMIN users see all fields including cost and profit
 * - EMPLOYEE users see only non-sensitive fields
 */
@ControllerAdvice
public class JsonViewResponseBodyAdvice extends AbstractMappingJacksonResponseBodyAdvice {

    @Override
    protected void beforeBodyWriteInternal(MappingJacksonValue bodyContainer,
                                           MediaType contentType,
                                           MethodParameter returnType,
                                           ServerHttpRequest request,
                                           ServerHttpResponse response) {
        // Only apply view if no view is already set
        if (bodyContainer.getSerializationView() == null) {
            Class<?> viewClass = getViewForCurrentUser();
            bodyContainer.setSerializationView(viewClass);
        }
    }

    /**
     * Determine the appropriate JsonView class based on the current user's role.
     */
    private Class<?> getViewForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            
            if ("ADMIN".equals(userDetails.getRole())) {
                return Views.Admin.class;
            }
        }
        
        // Default to Employee view (restricted)
        return Views.Employee.class;
    }
}
