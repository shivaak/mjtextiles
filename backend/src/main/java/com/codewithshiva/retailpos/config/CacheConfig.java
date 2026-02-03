package com.codewithshiva.retailpos.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration for the application.
 * Uses simple in-memory caching (ConcurrentMapCache).
 * For production, consider Redis or Caffeine for better performance.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String LOOKUPS_CACHE = "lookups";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(LOOKUPS_CACHE);
    }
}
