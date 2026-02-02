package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.RefreshTokenDao;
import com.codewithshiva.retailpos.dao.UserDao;
import com.codewithshiva.retailpos.dto.auth.UserResponse;
import com.codewithshiva.retailpos.dto.user.CreateUserRequest;
import com.codewithshiva.retailpos.dto.user.ResetPasswordRequest;
import com.codewithshiva.retailpos.dto.user.UpdateStatusRequest;
import com.codewithshiva.retailpos.dto.user.UpdateUserRequest;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for user management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;
    private final RefreshTokenDao refreshTokenDao;
    private final PasswordEncoder passwordEncoder;

    /**
     * List users with optional filters.
     */
    public List<UserResponse> listUsers(String role, Boolean isActive, String search) {
        log.debug("Listing users with filters - role: {}, isActive: {}, search: {}", role, isActive, search);

        List<User> users;
        if (role == null && isActive == null && search == null) {
            users = userDao.findAll();
        } else {
            users = userDao.findWithFilters(role, isActive, search);
        }

        return users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    /**
     * Get user by ID.
     */
    public UserResponse getUserById(Long id) {
        log.debug("Getting user by ID: {}", id);

        User user = userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER_NOT_FOUND",
                        "User not found with ID: " + id
                ));

        return UserResponse.fromUser(user);
    }

    /**
     * Create a new user.
     */
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user: {}", request.getUsername());

        // Check for duplicate username
        if (userDao.findByUsername(request.getUsername()).isPresent()) {
            log.warn("Username already exists: {}", request.getUsername());
            throw new ConflictException("DUPLICATE_USERNAME", "Username already exists");
        }

        // Hash password
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // Create user and get ID
        Long userId = userDao.createReturningId(
                request.getUsername(),
                passwordHash,
                request.getFullName(),
                request.getRole().name()
        );

        log.info("User created successfully with ID: {}", userId);

        // Fetch and return created user
        return getUserById(userId);
    }

    /**
     * Update an existing user.
     */
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user with ID: {}", id);

        // Verify user exists
        userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER_NOT_FOUND",
                        "User not found with ID: " + id
                ));

        // Update user
        userDao.update(id, request.getFullName(), request.getRole().name(), request.getIsActive());

        log.info("User updated successfully: {}", id);

        // Fetch and return updated user
        return getUserById(id);
    }

    /**
     * Reset a user's password.
     */
    public void resetPassword(Long id, ResetPasswordRequest request) {
        log.info("Resetting password for user ID: {}", id);

        // Verify user exists
        User user = userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER_NOT_FOUND",
                        "User not found with ID: " + id
                ));

        // Hash new password
        String passwordHash = passwordEncoder.encode(request.getNewPassword());

        // Update password
        userDao.updatePassword(id, passwordHash);

        // Revoke all refresh tokens for this user (force re-login on all devices)
        refreshTokenDao.revokeAllByUserId(id);

        log.info("Password reset successfully for user: {}", user.getUsername());
    }

    /**
     * Update user's active status.
     */
    public void updateStatus(Long id, UpdateStatusRequest request) {
        log.info("Updating status for user ID: {} to isActive: {}", id, request.getIsActive());

        // Verify user exists
        User user = userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER_NOT_FOUND",
                        "User not found with ID: " + id
                ));

        // Update status
        userDao.updateStatus(id, request.getIsActive());

        // If deactivating, revoke all refresh tokens
        if (!request.getIsActive()) {
            refreshTokenDao.revokeAllByUserId(id);
            log.info("User deactivated and all tokens revoked: {}", user.getUsername());
        } else {
            log.info("User activated: {}", user.getUsername());
        }
    }
}
