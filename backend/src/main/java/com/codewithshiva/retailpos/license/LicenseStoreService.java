package com.codewithshiva.retailpos.license;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@Slf4j
@Service
public class LicenseStoreService {

    @Value("${license.file-path:license/license.lic}")
    private String licenseFilePath;

    public void saveRawLicense(String rawLicense) {
        try {
            Path filePath = Path.of(licenseFilePath).toAbsolutePath();
            if (filePath.getParent() != null) {
                Files.createDirectories(filePath.getParent());
            }
            Files.writeString(filePath, rawLicense, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to persist license file", ex);
        }
    }

    public Optional<String> readRawLicense() {
        try {
            Path filePath = Path.of(licenseFilePath).toAbsolutePath();
            if (!Files.exists(filePath)) {
                return Optional.empty();
            }
            String content = Files.readString(filePath, StandardCharsets.UTF_8).trim();
            return content.isBlank() ? Optional.empty() : Optional.of(content);
        } catch (Exception ex) {
            log.warn("Unable to read local license file", ex);
            return Optional.empty();
        }
    }

    public void deleteRawLicenseIfExists() {
        try {
            Path filePath = Path.of(licenseFilePath).toAbsolutePath();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to remove local license file", ex);
        }
    }
}

