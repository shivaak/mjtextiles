package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.InventoryDao;
import com.codewithshiva.retailpos.dao.VariantDao;
import com.codewithshiva.retailpos.dto.inventory.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.InventorySummary;
import com.codewithshiva.retailpos.model.StockAdjustment;
import com.codewithshiva.retailpos.model.StockMovement;
import com.codewithshiva.retailpos.model.SupplierSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for inventory management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryDao inventoryDao;
    private final VariantDao variantDao;

    /**
     * Get inventory summary statistics.
     */
    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary() {
        log.debug("Getting inventory summary");
        InventorySummary summary = inventoryDao.getInventorySummary();
        return InventorySummaryResponse.fromInventorySummary(summary);
    }

    /**
     * Get stock movements for a variant with optional filters.
     */
    @Transactional(readOnly = true)
    public List<StockMovementResponse> getStockMovements(Long variantId, String startDate, 
                                                          String endDate, String type) {
        log.debug("Getting stock movements for variant ID: {} with filters - startDate: {}, endDate: {}, type: {}", 
                variantId, startDate, endDate, type);

        // Validate variant exists
        variantDao.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + variantId
                ));

        // Parse dates
        OffsetDateTime startDateTime = parseStartDate(startDate);
        OffsetDateTime endDateTime = parseEndDate(endDate);

        List<StockMovement> movements;
        if (startDateTime == null && endDateTime == null && type == null) {
            movements = inventoryDao.findMovementsByVariantId(variantId);
        } else {
            movements = inventoryDao.findMovementsWithFilters(variantId, startDateTime, endDateTime, type);
        }

        return movements.stream()
                .map(StockMovementResponse::fromStockMovement)
                .collect(Collectors.toList());
    }

    /**
     * Get supplier summary for a variant.
     */
    @Transactional(readOnly = true)
    public List<SupplierSummaryResponse> getSupplierSummary(Long variantId) {
        log.debug("Getting supplier summary for variant ID: {}", variantId);

        // Validate variant exists
        variantDao.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + variantId
                ));

        List<SupplierSummary> summaries = inventoryDao.findSupplierSummaryByVariantId(variantId);

        return summaries.stream()
                .map(SupplierSummaryResponse::fromSupplierSummary)
                .collect(Collectors.toList());
    }

    /**
     * Create a stock adjustment.
     * Validates that the resulting stock won't be negative for negative adjustments.
     */
    @Transactional
    @Auditable(entity = EntityType.STOCK_ADJUSTMENT, action = AuditAction.ADJUSTMENT)
    public StockAdjustmentResponse createStockAdjustment(CreateStockAdjustmentRequest request, Long createdBy) {
        log.info("Creating stock adjustment for variant ID: {} with delta: {}", 
                request.getVariantId(), request.getDeltaQty());

        // Validate variant exists
        variantDao.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "VARIANT_NOT_FOUND",
                        "Variant not found with ID: " + request.getVariantId()
                ));

        // Validate delta is not zero
        if (request.getDeltaQty() == 0) {
            throw new BadRequestException("INVALID_QUANTITY", "Delta quantity cannot be zero");
        }

        // For negative adjustments, check if stock is sufficient
        if (request.getDeltaQty() < 0) {
            Integer currentStock = inventoryDao.getVariantStockQty(request.getVariantId());
            int newStock = currentStock + request.getDeltaQty();
            
            if (newStock < 0) {
                log.warn("Insufficient stock for adjustment. Current: {}, Requested: {}", 
                        currentStock, request.getDeltaQty());
                throw new BadRequestException(
                        "INSUFFICIENT_STOCK",
                        "Cannot reduce stock below zero. Current stock: " + currentStock
                );
            }
        }

        // Create adjustment record
        Long adjustmentId = inventoryDao.createAdjustment(
                request.getVariantId(),
                request.getDeltaQty(),
                request.getReason(),
                request.getNotes(),
                createdBy
        );

        // Update variant stock
        inventoryDao.updateVariantStock(request.getVariantId(), request.getDeltaQty());

        log.info("Stock adjustment created with ID: {}. Variant {} stock updated by {}", 
                adjustmentId, request.getVariantId(), request.getDeltaQty());

        // Fetch and return created adjustment
        StockAdjustment adjustment = inventoryDao.findAdjustmentById(adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ADJUSTMENT_NOT_FOUND",
                        "Failed to retrieve created adjustment"
                ));

        return StockAdjustmentResponse.fromStockAdjustment(adjustment);
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
            return date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        } catch (Exception e) {
            throw new BadRequestException("INVALID_DATE", "Invalid end date format. Use YYYY-MM-DD");
        }
    }
}
