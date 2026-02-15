package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.ShortCodeDao;
import com.codewithshiva.retailpos.dto.shortcode.CreateShortCodeRequest;
import com.codewithshiva.retailpos.dto.shortcode.UpdateShortCodeRequest;
import com.codewithshiva.retailpos.dto.shortcode.ShortCodeResponse;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.ShortCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for short code management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShortCodeService {

    private final ShortCodeDao shortCodeDao;
    private final LookupService lookupService;

    /**
     * Get all short codes, optionally filtered by type.
     */
    @Transactional(readOnly = true)
    public List<ShortCodeResponse> getShortCodes(String type) {
        log.debug("Getting short codes for type: {}", type);

        List<ShortCode> shortCodes;
        if (type != null && !type.isEmpty()) {
            shortCodes = shortCodeDao.findByType(type);
        } else {
            shortCodes = shortCodeDao.findAll();
        }

        return shortCodes.stream()
                .map(ShortCodeResponse::fromShortCode)
                .collect(Collectors.toList());
    }

    /**
     * Create a new short code.
     */
    @Transactional
    public ShortCodeResponse createShortCode(CreateShortCodeRequest request) {
        log.info("Creating short code: {} - {} ({})", request.getType(), request.getName(), request.getShortCode());

        String upperCode = request.getShortCode().replaceAll("\\s+", "").toUpperCase();

        // Check for duplicate name
        if (shortCodeDao.findByTypeAndName(request.getType(), request.getName()).isPresent()) {
            throw new ConflictException("DUPLICATE_SHORT_CODE_NAME",
                    "A short code already exists for " + request.getType() + ": " + request.getName());
        }

        // Check for duplicate short code
        if (shortCodeDao.findByTypeAndShortCode(request.getType(), upperCode).isPresent()) {
            throw new ConflictException("DUPLICATE_SHORT_CODE",
                    "Short code '" + upperCode + "' already exists for type " + request.getType());
        }

        Long id = shortCodeDao.create(request.getType(), request.getName(), upperCode);

        log.info("Short code created with ID: {}", id);

        // Evict lookup cache
        lookupService.evictLookupCache();

        ShortCode created = shortCodeDao.findByTypeAndName(request.getType(), request.getName())
                .orElseThrow();

        return ShortCodeResponse.fromShortCode(created);
    }

    /**
     * Update an existing short code.
     */
    @Transactional
    public ShortCodeResponse updateShortCode(Long id, UpdateShortCodeRequest request) {
        log.info("Updating short code ID {}: {} ({})", id, request.getName(), request.getShortCode());

        ShortCode existing = shortCodeDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Short code not found with ID: " + id));

        String upperCode = request.getShortCode().replaceAll("\\s+", "").toUpperCase();

        // Check for duplicate name (excluding current record)
        if (shortCodeDao.findByTypeAndNameExcludingId(existing.getType(), request.getName(), id).isPresent()) {
            throw new ConflictException("DUPLICATE_SHORT_CODE_NAME",
                    "A short code already exists for " + existing.getType() + ": " + request.getName());
        }

        // Check for duplicate short code (excluding current record)
        if (shortCodeDao.findByTypeAndShortCodeExcludingId(existing.getType(), upperCode, id).isPresent()) {
            throw new ConflictException("DUPLICATE_SHORT_CODE",
                    "Short code '" + upperCode + "' already exists for type " + existing.getType());
        }

        shortCodeDao.update(id, request.getName(), upperCode);

        log.info("Short code updated: ID {}", id);

        // Evict lookup cache
        lookupService.evictLookupCache();

        ShortCode updated = shortCodeDao.findById(id).orElseThrow();
        return ShortCodeResponse.fromShortCode(updated);
    }

    /**
     * Delete a short code if it is not in use.
     */
    @Transactional
    public void deleteShortCode(Long id) {
        log.info("Deleting short code ID: {}", id);

        ShortCode existing = shortCodeDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Short code not found with ID: " + id));

        // Check if in use
        int usageCount = getUsageCount(existing.getType(), existing.getName());
        if (usageCount > 0) {
            throw new ConflictException("SHORT_CODE_IN_USE",
                    "Cannot delete '" + existing.getName() + "' because it is used by " + usageCount +
                    " " + getUsageEntity(existing.getType()) + "(s)");
        }

        shortCodeDao.delete(id);

        log.info("Short code deleted: ID {} ({} - {})", id, existing.getType(), existing.getName());

        // Evict lookup cache
        lookupService.evictLookupCache();
    }

    private int getUsageCount(String type, String name) {
        return switch (type) {
            case "CATEGORY" -> shortCodeDao.countProductsByCategory(name);
            case "BRAND" -> shortCodeDao.countProductsByBrand(name);
            case "FABRIC" -> shortCodeDao.countVariantsByFabric(name);
            case "SIZE" -> shortCodeDao.countVariantsBySize(name);
            case "COLOR" -> shortCodeDao.countVariantsByColor(name);
            case "VARIANT_TYPE" -> shortCodeDao.countVariantsByVariantType(name);
            default -> 0;
        };
    }

    private String getUsageEntity(String type) {
        return switch (type) {
            case "CATEGORY", "BRAND" -> "product";
            case "FABRIC", "SIZE", "COLOR" -> "variant";
            default -> "record";
        };
    }
}
