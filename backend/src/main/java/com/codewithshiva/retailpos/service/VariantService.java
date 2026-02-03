package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.ProductDao;
import com.codewithshiva.retailpos.dao.VariantDao;
import com.codewithshiva.retailpos.dto.variant.*;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Variant;
import com.codewithshiva.retailpos.model.VariantWithProduct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for variant management operations.
 */
@Slf4j
@Service
public class VariantService {

    private final VariantDao variantDao;
    private final ProductDao productDao;
    private final LookupService lookupService;

    public VariantService(VariantDao variantDao, ProductDao productDao, @Lazy LookupService lookupService) {
        this.variantDao = variantDao;
        this.productDao = productDao;
        this.lookupService = lookupService;
    }

    /**
     * List variants with optional filters.
     */
    @Transactional(readOnly = true)
    public List<VariantListResponse> listVariants(Long productId, String category, String brand,
                                                   String status, Boolean lowStock, Boolean outOfStock,
                                                   String search) {
        log.debug("Listing variants with filters - productId: {}, category: {}, brand: {}, status: {}, lowStock: {}, outOfStock: {}, search: {}",
                productId, category, brand, status, lowStock, outOfStock, search);

        List<VariantWithProduct> variants;

        // Handle special filters
        if (Boolean.TRUE.equals(outOfStock)) {
            variants = variantDao.findOutOfStock(productId, category, brand, status, search);
        } else if (Boolean.TRUE.equals(lowStock)) {
            variants = variantDao.findLowStock(productId, category, brand, status, search);
        } else {
            variants = variantDao.findWithFilters(productId, category, brand, status, search);
        }

        return variants.stream()
                .map(VariantListResponse::fromVariantWithProduct)
                .collect(Collectors.toList());
    }

    /**
     * Get variant by ID with product information.
     */
    @Transactional(readOnly = true)
    public VariantDetailResponse getVariantById(Long id) {
        log.debug("Getting variant by ID: {}", id);

        VariantWithProduct variant = variantDao.findByIdWithProduct(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + id
                ));

        return VariantDetailResponse.fromVariantWithProduct(variant);
    }

    /**
     * Get variant by barcode (for POS).
     */
    @Transactional(readOnly = true)
    public VariantSearchResponse getVariantByBarcode(String barcode) {
        log.debug("Getting variant by barcode: {}", barcode);

        VariantWithProduct variant = variantDao.findByBarcodeWithProduct(barcode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "No variant found with barcode: " + barcode
                ));

        return VariantSearchResponse.fromVariantWithProduct(variant);
    }

    /**
     * Search variants for POS autocomplete.
     */
    @Transactional(readOnly = true)
    public List<VariantSearchResponse> searchVariants(String query, int limit) {
        log.debug("Searching variants with query: {}, limit: {}", query, limit);

        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        // Ensure reasonable limit
        int effectiveLimit = Math.min(Math.max(limit, 1), 50);

        List<VariantWithProduct> variants = variantDao.search(query.trim(), effectiveLimit);

        return variants.stream()
                .map(VariantSearchResponse::fromVariantWithProduct)
                .collect(Collectors.toList());
    }

    /**
     * Create a new variant.
     */
    @Transactional
    @Auditable(entity = EntityType.VARIANT, action = AuditAction.CREATE)
    public VariantDetailResponse createVariant(CreateVariantRequest request, Long createdBy) {
        log.info("Creating variant with SKU: {} for product ID: {}", request.getSku(), request.getProductId());

        // Validate product exists
        productDao.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Product not found with ID: " + request.getProductId()
                ));

        // Check for duplicate SKU
        if (variantDao.findBySku(request.getSku()).isPresent()) {
            log.warn("Duplicate SKU: {}", request.getSku());
            throw new ConflictException("DUPLICATE_SKU", "SKU already exists: " + request.getSku());
        }

        // Check for duplicate barcode (if provided)
        if (request.getBarcode() != null && !request.getBarcode().trim().isEmpty()) {
            if (variantDao.findByBarcode(request.getBarcode()).isPresent()) {
                log.warn("Duplicate barcode: {}", request.getBarcode());
                throw new ConflictException("DUPLICATE_BARCODE", "Barcode already exists: " + request.getBarcode());
            }
        }

        // Set default avgCost if not provided
        BigDecimal avgCost = request.getAvgCost() != null ? request.getAvgCost() : BigDecimal.ZERO;

        // Create variant
        Long variantId = variantDao.create(
                request.getProductId(),
                request.getSku(),
                request.getBarcode(),
                request.getSize(),
                request.getColor(),
                request.getSellingPrice(),
                avgCost,
                createdBy
        );

        log.info("Variant created successfully with ID: {}", variantId);

        // Evict lookup cache since sizes/colors may have changed
        lookupService.evictLookupCache();

        // Fetch and return created variant with product info
        return getVariantById(variantId);
    }

    /**
     * Update an existing variant.
     */
    @Transactional
    @Auditable(entity = EntityType.VARIANT, action = AuditAction.UPDATE)
    public VariantDetailResponse updateVariant(Long id, UpdateVariantRequest request) {
        log.info("Updating variant with ID: {}", id);

        // Verify variant exists
        Variant existingVariant = variantDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + id
                ));

        // Check for duplicate SKU (excluding self)
        if (!existingVariant.getSku().equals(request.getSku())) {
            Optional<Variant> duplicateSku = variantDao.findBySkuExcludingId(request.getSku(), id);
            if (duplicateSku.isPresent()) {
                log.warn("Duplicate SKU: {}", request.getSku());
                throw new ConflictException("DUPLICATE_SKU", "SKU already exists: " + request.getSku());
            }
        }

        // Check for duplicate barcode (excluding self, if provided)
        if (request.getBarcode() != null && !request.getBarcode().trim().isEmpty()) {
            String existingBarcode = existingVariant.getBarcode();
            if (existingBarcode == null || !existingBarcode.equals(request.getBarcode())) {
                Optional<Variant> duplicateBarcode = variantDao.findByBarcodeExcludingId(request.getBarcode(), id);
                if (duplicateBarcode.isPresent()) {
                    log.warn("Duplicate barcode: {}", request.getBarcode());
                    throw new ConflictException("DUPLICATE_BARCODE", "Barcode already exists: " + request.getBarcode());
                }
            }
        }

        // Set default avgCost if not provided
        BigDecimal avgCost = request.getAvgCost() != null ? request.getAvgCost() : existingVariant.getAvgCost();

        // Update variant
        variantDao.update(
                id,
                request.getSku(),
                request.getBarcode(),
                request.getSize(),
                request.getColor(),
                request.getSellingPrice(),
                avgCost
        );

        log.info("Variant updated successfully: {}", id);

        // Evict lookup cache since sizes/colors may have changed
        lookupService.evictLookupCache();

        // Fetch and return updated variant with product info
        return getVariantById(id);
    }

    /**
     * Update variant status.
     */
    @Transactional
    @Auditable(entity = EntityType.VARIANT, action = AuditAction.STATUS_CHANGE)
    public void updateVariantStatus(Long id, String status) {
        log.info("Updating variant status for ID: {} to: {}", id, status);

        // Verify variant exists
        variantDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + id
                ));

        // Update status
        variantDao.updateStatus(id, status);

        log.info("Variant status updated successfully: {} -> {}", id, status);
    }
}
