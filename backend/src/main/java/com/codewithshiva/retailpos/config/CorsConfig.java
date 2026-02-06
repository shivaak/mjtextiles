package com.codewithshiva.retailpos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${frontend.url:}")
    String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Only enable CORS when a frontend URL is configured (development mode).
        // In production the SPA is served from the same origin, so CORS is not needed.
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            configuration.setAllowedOrigins(List.of(frontendUrl));

            configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
            ));

            configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
            ));

            configuration.setExposedHeaders(List.of(
                "Authorization",
                "Content-Type"
            ));

            configuration.setAllowCredentials(true);

            configuration.setMaxAge(3600L);
        }

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
