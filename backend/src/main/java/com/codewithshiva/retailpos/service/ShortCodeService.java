package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.ShortCodeDao;
import com.codewithshiva.retailpos.dto.shortcode.CreateShortCodeRequest;
import com.codewithshiva.retailpos.dto.shortcode.ShortCodeResponse;
import com.codewithshiva.retailpos.exception.ConflictException;
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

        String upperCode = request.getShortCode().toUpperCase();

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
}
