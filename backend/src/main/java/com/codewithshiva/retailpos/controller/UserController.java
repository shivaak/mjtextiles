package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.auth.UserResponse;
import com.codewithshiva.retailpos.dto.user.CreateUserRequest;
import com.codewithshiva.retailpos.dto.user.ResetPasswordRequest;
import com.codewithshiva.retailpos.dto.user.UserLookupResponse;
import com.codewithshiva.retailpos.dto.user.UpdateStatusRequest;
import com.codewithshiva.retailpos.dto.user.UpdateUserRequest;
import com.codewithshiva.retailpos.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for user management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints (Admin only)")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List Users", description = "Get all users with optional filters")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search) {
        log.debug("List users request - role: {}, isActive: {}, search: {}", role, isActive, search);
        List<UserResponse> users = userService.listUsers(role, isActive, search);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get User by ID", description = "Get a specific user by ID")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        log.debug("Get user request for ID: {}", id);
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/lookup")
    @Operation(summary = "Lookup users", description = "Get users for cashier dropdowns")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<UserLookupResponse>>> lookupUsers(
            @RequestParam(required = false) String role) {
        log.debug("Lookup users request - role: {}", role);
        List<String> roles = null;
        if (role != null && !role.trim().isEmpty()) {
            roles = Arrays.stream(role.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .collect(Collectors.toList());
        }
        List<UserLookupResponse> users = userService.listUsersForLookup(roles);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping
    @Operation(summary = "Create User", description = "Create a new user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        log.info("Create user request for username: {}", request.getUsername());
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "User created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update User", description = "Update an existing user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("Update user request for ID: {}", id);
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }

    @PutMapping("/{id}/reset-password")
    @Operation(summary = "Reset User Password", description = "Reset a user's password")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request for user ID: {}", id);
        userService.resetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Toggle User Status", description = "Activate or deactivate a user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        log.info("Update status request for user ID: {} to isActive: {}", id, request.getIsActive());
        userService.updateStatus(id, request);
        String message = request.getIsActive() ? "User activated successfully" : "User deactivated successfully";
        return ResponseEntity.ok(ApiResponse.success(message));
    }
}
