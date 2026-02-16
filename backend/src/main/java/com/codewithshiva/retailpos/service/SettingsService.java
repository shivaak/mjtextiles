package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.SettingsDao;
import com.codewithshiva.retailpos.dto.settings.PublicBrandingResponse;
import com.codewithshiva.retailpos.dto.settings.SettingsResponse;
import com.codewithshiva.retailpos.dto.settings.UpdateSettingsRequest;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Settings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for shop settings operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsDao settingsDao;
    private final LogoStorageService logoStorageService;

    /**
     * Get shop settings.
     */
    public SettingsResponse getSettings() {
        log.debug("Fetching shop settings");
        return toSettingsResponse(getRequiredSettings());
    }

    /**
     * Update shop settings.
     */
    @Auditable(entity = EntityType.SETTINGS, action = AuditAction.UPDATE)
    public SettingsResponse updateSettings(UpdateSettingsRequest request) {
        log.info("Updating shop settings");

        // Verify settings exist
        getRequiredSettings();

        // Update settings
        settingsDao.update(
                request.getShopName(),
                request.getAddress(),
                request.getPhone(),
                request.getEmail(),
                request.getGstNumber(),
                request.getCurrency(),
                request.getTaxPercent(),
                request.getInvoicePrefix(),
                request.getLowStockThreshold(),
                request.getLoyaltyEnabled(),
                request.getPointsMinPurchaseAmount(),
                request.getPointsPerHundred(),
                request.getPointValue(),
                request.getMaxPointsRedemptionPercent()
        );

        log.info("Shop settings updated successfully");

        // Fetch and return updated settings
        return getSettings();
    }

    @Auditable(entity = EntityType.SETTINGS, action = AuditAction.UPDATE)
    public SettingsResponse uploadLogo(MultipartFile file) {
        Settings settings = getRequiredSettings();
        String oldLogoPath = settings.getLogoPath();
        String newLogoPath = logoStorageService.storeLogo(file);

        settingsDao.updateLogoPath(newLogoPath);
        if (oldLogoPath != null && !oldLogoPath.isBlank() && !oldLogoPath.equals(newLogoPath)) {
            logoStorageService.deleteIfExists(oldLogoPath);
        }
        return getSettings();
    }

    @Auditable(entity = EntityType.SETTINGS, action = AuditAction.UPDATE)
    public SettingsResponse deleteLogo() {
        Settings settings = getRequiredSettings();
        String oldLogoPath = settings.getLogoPath();

        settingsDao.clearLogoPath();
        if (oldLogoPath != null && !oldLogoPath.isBlank()) {
            logoStorageService.deleteIfExists(oldLogoPath);
        }
        return getSettings();
    }

    public PublicBrandingResponse getPublicBranding() {
        Settings settings = getRequiredSettings();
        return PublicBrandingResponse.builder()
                .shopName(settings.getShopName())
                .logoUrl(logoStorageService.toPublicLogoUrl(settings.getLogoPath()).orElse(null))
                .build();
    }

    private Settings getRequiredSettings() {
        return settingsDao.get()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SETTINGS_NOT_FOUND",
                        "Settings not found. Please initialize settings first."
                ));
    }

    private SettingsResponse toSettingsResponse(Settings settings) {
        SettingsResponse response = SettingsResponse.fromSettings(settings);
        response.setLogoUrl(logoStorageService.toPublicLogoUrl(settings.getLogoPath()).orElse(null));
        return response;
    }
}
