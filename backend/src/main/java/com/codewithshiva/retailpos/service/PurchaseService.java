package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.PurchaseDao;
import com.codewithshiva.retailpos.dao.SupplierDao;
import com.codewithshiva.retailpos.dao.VariantDao;
import com.codewithshiva.retailpos.dto.purchase.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.PurchaseItemWithVariant;
import com.codewithshiva.retailpos.model.PurchaseWithDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for purchase management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseDao purchaseDao;
    private final SupplierDao supplierDao;
    private final VariantDao variantDao;

    /**
     * List purchases with optional filters.
     */
    @Transactional(readOnly = true)
    public List<PurchaseListResponse> listPurchases(Long supplierId, String startDate, 
                                                     String endDate, String search) {
        log.debug("Listing purchases with filters - supplierId: {}, startDate: {}, endDate: {}, search: {}", 
                supplierId, startDate, endDate, search);

        // Parse date strings to OffsetDateTime
        OffsetDateTime startDateTime = parseStartDate(startDate);
        OffsetDateTime endDateTime = parseEndDate(endDate);
        String trimmedSearch = normalizeSearch(search);

        List<PurchaseWithDetails> purchases;
        if (supplierId == null && startDateTime == null && endDateTime == null && trimmedSearch == null) {
            purchases = purchaseDao.findAll();
        } else {
            purchases = purchaseDao.findWithFilters(supplierId, startDateTime, endDateTime, trimmedSearch);
        }

        return purchases.stream()
                .map(PurchaseListResponse::fromPurchaseWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * Get purchase by ID with all items.
     */
    @Transactional(readOnly = true)
    public PurchaseDetailResponse getPurchaseById(Long id) {
        log.debug("Getting purchase by ID: {}", id);

        PurchaseWithDetails purchase = purchaseDao.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PURCHASE_NOT_FOUND",
                        "Purchase not found with ID: " + id
                ));

        List<PurchaseItemWithVariant> items = purchaseDao.findItemsByPurchaseId(id);

        return PurchaseDetailResponse.fromPurchaseWithDetails(purchase, items);
    }

    /**
     * Create a new purchase.
     * This method:
     * 1. Validates supplier exists
     * 2. Validates all variant IDs exist
     * 3. Calculates total cost
     * 4. Creates purchase record
     * 5. Creates purchase items
     * 6. Updates variant stock using PostgreSQL function
     */
    @Transactional
    @Auditable(entity = EntityType.PURCHASE, action = AuditAction.CREATE)
    public PurchaseDetailResponse createPurchase(CreatePurchaseRequest request, Long createdBy) {
        log.info("Creating purchase for supplier ID: {} with {} items", 
                request.getSupplierId(), request.getItems().size());

        // 1. Validate supplier exists
        supplierDao.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SUPPLIER_NOT_FOUND",
                        "Supplier not found with ID: " + request.getSupplierId()
                ));

        // 2. Validate all variant IDs exist
        Set<Long> variantIds = new HashSet<>();
        for (CreatePurchaseItemRequest item : request.getItems()) {
            variantIds.add(item.getVariantId());
        }
        
        for (Long variantId : variantIds) {
            variantDao.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "VARIANT_NOT_FOUND",
                            "Variant not found with ID: " + variantId
                    ));
        }

        // 3. Calculate total cost
        BigDecimal totalCost = BigDecimal.ZERO;
        for (CreatePurchaseItemRequest item : request.getItems()) {
            BigDecimal itemTotal = item.getUnitCost().multiply(BigDecimal.valueOf(item.getQty()));
            totalCost = totalCost.add(itemTotal);
        }

        // 4. Create purchase record
        Long purchaseId = purchaseDao.create(
                request.getSupplierId(),
                request.getInvoiceNo(),
                request.getPurchasedAt(),
                totalCost,
                request.getNotes(),
                createdBy
        );

        log.info("Purchase created with ID: {}", purchaseId);

        // 5. Create purchase items and update stock
        for (CreatePurchaseItemRequest item : request.getItems()) {
            // Create purchase item
            purchaseDao.createItem(
                    purchaseId,
                    item.getVariantId(),
                    item.getQty(),
                    item.getUnitCost()
            );

            // 6. Update variant stock using PostgreSQL function
            // This calculates weighted average cost and updates stock atomically
            purchaseDao.updateVariantStockOnPurchase(
                    item.getVariantId(),
                    item.getQty(),
                    item.getUnitCost()
            );

            log.debug("Stock updated for variant ID: {} (+{} units at cost {})", 
                    item.getVariantId(), item.getQty(), item.getUnitCost());
        }

        log.info("Purchase created successfully with {} items. Total cost: {}", 
                request.getItems().size(), totalCost);

        // Return created purchase with details
        return getPurchaseById(purchaseId);
    }

    /**
     * Parse start date string (YYYY-MM-DD) to OffsetDateTime at start of day.
     */
    private OffsetDateTime parseStartDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(dateStr);
            return date.atStartOfDay().atOffset(ZoneOffset.UTC);
        } catch (Exception e) {
            throw new BadRequestException("INVALID_DATE", "Invalid start date format. Use YYYY-MM-DD");
        }
    }

    /**
     * Parse end date string (YYYY-MM-DD) to OffsetDateTime at end of day (exclusive next day).
     */
    private OffsetDateTime parseEndDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(dateStr);
            // Add one day for exclusive end (purchases before this time)
            return date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        } catch (Exception e) {
            throw new BadRequestException("INVALID_DATE", "Invalid end date format. Use YYYY-MM-DD");
        }
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
