package com.codewithshiva.retailpos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.logo.upload-dir:uploads/logos}")
    private String logoUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path logoDirectory = Path.of(logoUploadDir).toAbsolutePath().normalize();
        String location = logoDirectory.toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }

        registry.addResourceHandler("/uploads/logos/**")
                .addResourceLocations(location);
    }
}
