package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hello World endpoints for testing authentication and authorization.
 */
@RestController
@RequestMapping("/api/v1/hello")
@Tag(name = "Hello", description = "Hello World endpoints for testing")
@SecurityRequirement(name = "bearerAuth")
public class HelloController {

    @GetMapping
    @Operation(summary = "Hello World", description = "Returns hello message - accessible by any authenticated user")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<String>> helloWorld() {
        return ResponseEntity.ok(ApiResponse.success("Hello, World!"));
    }

    @GetMapping("/admin")
    @Operation(summary = "Hello Admin", description = "Returns admin message - accessible by ADMIN only")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> helloAdmin() {
        return ResponseEntity.ok(ApiResponse.success("Hello, Admin!"));
    }
}
