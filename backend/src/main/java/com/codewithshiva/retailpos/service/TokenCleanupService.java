package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.RefreshTokenDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduled service for cleaning up expired and revoked refresh tokens.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenCleanupService {

    private final RefreshTokenDao refreshTokenDao;

    /**
     * Clean up expired and revoked tokens every hour.
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    public void cleanupExpiredTokens() {
        log.info("Starting cleanup of expired and revoked tokens");
        int deletedCount = refreshTokenDao.deleteExpiredAndRevokedTokens();
        if (deletedCount > 0) {
            log.info("Cleaned up {} expired/revoked refresh tokens", deletedCount);
        }
    }
}
