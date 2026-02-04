package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.SettingsDao;
import com.codewithshiva.retailpos.dto.settings.SettingsResponse;
import com.codewithshiva.retailpos.dto.settings.UpdateSettingsRequest;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Settings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for shop settings operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsDao settingsDao;

    /**
     * Get shop settings.
     */
    public SettingsResponse getSettings() {
        log.debug("Fetching shop settings");

        Settings settings = settingsDao.get()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SETTINGS_NOT_FOUND",
                        "Settings not found. Please initialize settings first."
                ));

        return SettingsResponse.fromSettings(settings);
    }

    /**
     * Update shop settings.
     */
    @Auditable(entity = EntityType.SETTINGS, action = AuditAction.UPDATE)
    public SettingsResponse updateSettings(UpdateSettingsRequest request) {
        log.info("Updating shop settings");

        // Verify settings exist
        settingsDao.get()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SETTINGS_NOT_FOUND",
                        "Settings not found. Please initialize settings first."
                ));

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
                request.getLowStockThreshold()
        );

        log.info("Shop settings updated successfully");

        // Fetch and return updated settings
        return getSettings();
    }
}
