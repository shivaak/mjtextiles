package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.LookupDao;
import com.codewithshiva.retailpos.dto.lookup.LookupDataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Service for lookup/utility operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LookupService {

    private final LookupDao lookupDao;

    // Static lookup values
    private static final List<String> PAYMENT_MODES = Arrays.asList(
            "CASH", "CARD", "UPI", "CREDIT"
    );

    private static final List<String> ADJUSTMENT_REASONS = Arrays.asList(
            "OPENING_STOCK", "DAMAGE", "THEFT", "CORRECTION", "RETURN", "OTHER"
    );

    private static final List<String> USER_ROLES = Arrays.asList(
            "ADMIN", "EMPLOYEE"
    );

    /**
     * Get all lookup data for dropdowns.
     */
    @Transactional(readOnly = true)
    public LookupDataResponse getAllLookupData() {
        log.debug("Fetching all lookup data");

        List<String> categories = lookupDao.findAllCategories();
        List<String> brands = lookupDao.findAllBrands();
        List<String> sizes = lookupDao.findAllSizes();
        List<String> colors = lookupDao.findAllColors();

        return LookupDataResponse.builder()
                .categories(categories)
                .brands(brands)
                .sizes(sizes)
                .colors(colors)
                .paymentModes(PAYMENT_MODES)
                .adjustmentReasons(ADJUSTMENT_REASONS)
                .userRoles(USER_ROLES)
                .build();
    }
}
