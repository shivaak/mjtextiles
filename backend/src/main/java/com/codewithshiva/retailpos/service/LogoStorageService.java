package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class LogoStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final String PUBLIC_LOGO_PREFIX = "/uploads/logos/";

    @Value("${app.logo.upload-dir:uploads/logos}")
    private String logoUploadDir;

    @Value("${app.logo.max-size-bytes:2097152}")
    private long maxLogoSizeBytes;

    public String storeLogo(MultipartFile file) {
        validateLogo(file);
        String extension = detectExtension(file);
        String filename = UUID.randomUUID() + "." + extension;

        try {
            Path dirPath = getLogoDirectoryPath();
            Files.createDirectories(dirPath);
            Path targetPath = dirPath.resolve(filename).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to store logo file", ex);
        }
    }

    public void deleteIfExists(String logoPath) {
        try {
            Optional<Path> existing = resolveExistingPath(logoPath);
            if (existing.isPresent()) {
                Files.deleteIfExists(existing.get());
            }
        } catch (Exception ex) {
            log.warn("Failed to delete logo file {}", logoPath, ex);
        }
    }

    public Optional<String> toPublicLogoUrl(String logoPath) {
        if (!hasText(logoPath)) {
            return Optional.empty();
        }

        return resolveExistingPath(logoPath)
                .map(path -> PUBLIC_LOGO_PREFIX + logoPath.trim());
    }

    public Optional<Path> resolveExistingPath(String logoPath) {
        if (!hasText(logoPath)) {
            return Optional.empty();
        }

        Path resolved = getLogoDirectoryPath().resolve(logoPath.trim()).normalize();
        if (!resolved.startsWith(getLogoDirectoryPath())) {
            return Optional.empty();
        }

        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            return Optional.empty();
        }

        return Optional.of(resolved);
    }

    private void validateLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("LOGO_FILE_REQUIRED", "Logo file is required");
        }

        if (file.getSize() > maxLogoSizeBytes) {
            throw new BadRequestException("LOGO_TOO_LARGE", "Logo file size must be less than 2MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("INVALID_LOGO_TYPE", "Logo must be PNG, JPG, or WEBP");
        }
    }

    private String detectExtension(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        switch (contentType) {
            case "image/png":
                return "png";
            case "image/jpeg":
            case "image/jpg":
                return "jpg";
            case "image/webp":
                return "webp";
            default:
                String originalName = file.getOriginalFilename();
                if (originalName == null) {
                    throw new BadRequestException("INVALID_LOGO_TYPE", "Unable to determine logo file extension");
                }
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex < 0) {
                    throw new BadRequestException("INVALID_LOGO_TYPE", "Logo file extension is missing");
                }
                String extension = originalName.substring(dotIndex + 1).toLowerCase(Locale.ROOT).trim();
                if (!ALLOWED_EXTENSIONS.contains(extension)) {
                    throw new BadRequestException("INVALID_LOGO_TYPE", "Logo must be PNG, JPG, or WEBP");
                }
                return extension;
        }
    }

    private Path getLogoDirectoryPath() {
        return Path.of(logoUploadDir).toAbsolutePath().normalize();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
