package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.RefreshTokenDao;
import com.codewithshiva.retailpos.dao.UserDao;
import com.codewithshiva.retailpos.dto.auth.*;
import com.codewithshiva.retailpos.exception.AuthenticationException;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.model.RefreshToken;
import com.codewithshiva.retailpos.model.User;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Service for authentication operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserDao userDao;
    private final RefreshTokenDao refreshTokenDao;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Value("${jwt.inactivity-timeout}")
    private long inactivityTimeout;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Authenticate user and generate tokens.
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        // Find user by username
        User user = userDao.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getUsername());
                    return new AuthenticationException(
                            AuthenticationException.INVALID_CREDENTIALS,
                            "Invalid username or password"
                    );
                });

        // Check if user is active
        if (!user.isActive()) {
            log.warn("Login failed - account disabled: {}", request.getUsername());
            throw new AuthenticationException(
                    AuthenticationException.ACCOUNT_DISABLED,
                    "Account is disabled"
            );
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - invalid password for user: {}", request.getUsername());
            throw new AuthenticationException(
                    AuthenticationException.INVALID_CREDENTIALS,
                    "Invalid username or password"
            );
        }

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken();

        // Calculate refresh token expiry
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpiration);

        // Save refresh token
        refreshTokenDao.save(user.getId(), refreshToken, expiresAt.format(DATE_FORMATTER));

        // Update last login
        userDao.updateLastLogin(user.getId());

        log.info("Login successful for user: {}", user.getUsername());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtUtil.getAccessTokenExpirationSeconds())
                .user(UserResponse.fromUser(user))
                .build();
    }

    /**
     * Refresh access token using refresh token.
     */
    public TokenResponse refresh(RefreshTokenRequest request) {
        log.debug("Token refresh attempt");

        // Find refresh token
        RefreshToken storedToken = refreshTokenDao.findByToken(request.getRefreshToken())
                .orElseThrow(() -> {
                    log.warn("Refresh failed - token not found");
                    return new AuthenticationException(
                            AuthenticationException.INVALID_TOKEN,
                            "Invalid refresh token"
                    );
                });

        // Check if token is expired
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh failed - token expired");
            throw new AuthenticationException(
                    AuthenticationException.TOKEN_EXPIRED,
                    "Refresh token has expired"
            );
        }

        // Check inactivity timeout
        LocalDateTime lastUsedAt = storedToken.getLastUsedAt();
        if (lastUsedAt != null) {
            long secondsSinceLastUse = ChronoUnit.SECONDS.between(lastUsedAt, LocalDateTime.now());
            if (secondsSinceLastUse > inactivityTimeout) {
                log.warn("Refresh failed - session expired due to inactivity ({}s since last use)", secondsSinceLastUse);
                // Revoke the token
                refreshTokenDao.revokeByToken(request.getRefreshToken());
                throw new AuthenticationException(
                        AuthenticationException.SESSION_EXPIRED,
                        "Session expired due to inactivity. Please log in again."
                );
            }
        }

        // Get user
        User user = userDao.findById(storedToken.getUserId())
                .orElseThrow(() -> new AuthenticationException(
                        AuthenticationException.INVALID_TOKEN,
                        "User not found"
                ));

        // Check if user is still active
        if (!user.isActive()) {
            log.warn("Refresh failed - account disabled: {}", user.getUsername());
            throw new AuthenticationException(
                    AuthenticationException.ACCOUNT_DISABLED,
                    "Account is disabled"
            );
        }

        // Update last used timestamp
        refreshTokenDao.updateLastUsedAt(request.getRefreshToken());

        // Generate new access token
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());

        log.debug("Token refresh successful for user: {}", user.getUsername());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .expiresIn(jwtUtil.getAccessTokenExpirationSeconds())
                .build();
    }

    /**
     * Logout user by revoking refresh token.
     */
    public void logout(RefreshTokenRequest request) {
        log.info("Logout attempt");

        refreshTokenDao.revokeByToken(request.getRefreshToken());

        log.info("Logout successful");
    }

    /**
     * Get current authenticated user.
     */
    public UserResponse getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        return UserResponse.fromUser(userDetails.getUser());
    }

    /**
     * Change password for current user.
     */
    public void changePassword(ChangePasswordRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        User user = userDetails.getUser();
        log.info("Password change attempt for user: {}", user.getUsername());

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            log.warn("Password change failed - incorrect current password for user: {}", user.getUsername());
            throw new BadRequestException("INCORRECT_PASSWORD", "Current password is incorrect");
        }

        // Check if new password is different
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("SAME_PASSWORD", "New password must be different from current password");
        }

        // Update password
        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());
        userDao.updatePassword(user.getId(), newPasswordHash);

        // Revoke all refresh tokens for this user (force re-login on all devices)
        refreshTokenDao.revokeAllByUserId(user.getId());

        log.info("Password changed successfully for user: {}", user.getUsername());
    }
}
