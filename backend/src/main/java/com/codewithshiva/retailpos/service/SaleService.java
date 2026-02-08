package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.SaleDao;
import com.codewithshiva.retailpos.dao.VariantDao;
import com.codewithshiva.retailpos.dto.sale.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.codewithshiva.retailpos.model.SaleWithDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for sale management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleDao saleDao;
    private final VariantDao variantDao;

    /**
     * List sales with optional filters.
     */
    @Transactional(readOnly = true)
    public List<SaleListResponse> listSales(String startDate, String endDate, String paymentMode,
                                            String status, Long createdBy, String search) {
        log.debug("Listing sales with filters - startDate: {}, endDate: {}, paymentMode: {}, status: {}, createdBy: {}, search: {}",
                startDate, endDate, paymentMode, status, createdBy, search);

        OffsetDateTime startDateTime = parseStartDate(startDate);
        OffsetDateTime endDateTime = parseEndDate(endDate);

        List<SaleWithDetails> sales;
        if (startDateTime == null && endDateTime == null && paymentMode == null && 
            status == null && createdBy == null && search == null) {
            sales = saleDao.findAll();
        } else {
            sales = saleDao.findWithFilters(startDateTime, endDateTime, paymentMode, status, createdBy, search);
        }

        return sales.stream()
                .map(SaleListResponse::fromSaleWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * Get sale by ID with all items.
     */
    @Transactional(readOnly = true)
    public SaleDetailResponse getSaleById(Long id) {
        log.debug("Getting sale by ID: {}", id);

        SaleWithDetails sale = saleDao.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SALE_NOT_FOUND",
                        "Sale not found with ID: " + id
                ));

        List<SaleItemWithVariant> items = saleDao.findItemsBySaleId(id);

        return SaleDetailResponse.fromSaleWithDetails(sale, items);
    }

    /**
     * Create a new sale.
     * This method:
     * 1. Validates all variants exist
     * 2. Pre-validates stock availability for all items
     * 3. Generates bill number
     * 4. Gets tax percent from settings
     * 5. Decreases stock and captures avg_cost for each item
     * 6. Calculates subtotal, discount, tax, total, and profit
     * 7. Creates sale and sale items records
     */
    @Transactional
    @Auditable(entity = EntityType.SALE, action = AuditAction.CREATE)
    public SaleDetailResponse createSale(CreateSaleRequest request, Long createdBy) {
        log.info("Creating sale with {} items, payment mode: {}", request.getItems().size(), request.getPaymentMode());

        // 1. Validate all variants exist and pre-validate stock
        Map<Long, Integer> requiredStock = new HashMap<>();
        for (CreateSaleItemRequest item : request.getItems()) {
            requiredStock.merge(item.getVariantId(), item.getQty(), Integer::sum);
        }

        for (Map.Entry<Long, Integer> entry : requiredStock.entrySet()) {
            Long variantId = entry.getKey();
            Integer requiredQty = entry.getValue();

            // Check variant exists
            variantDao.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "VARIANT_NOT_FOUND",
                            "Variant not found with ID: " + variantId
                    ));

            // Pre-validate stock
            Integer availableStock = saleDao.getVariantStockQty(variantId);
            if (availableStock < requiredQty) {
                String sku = saleDao.getVariantSku(variantId);
                log.warn("Insufficient stock for variant {}: available={}, required={}", sku, availableStock, requiredQty);
                throw new BadRequestException(
                        "INSUFFICIENT_STOCK",
                        String.format("Insufficient stock for %s. Available: %d, Requested: %d", sku, availableStock, requiredQty)
                );
            }
        }

        // 2. Generate bill number
        String billNo = saleDao.generateBillNumber();
        log.debug("Generated bill number: {}", billNo);

        // 3. Get tax percent from settings
        BigDecimal taxPercent = saleDao.getTaxPercent();
        if (taxPercent == null) {
            taxPercent = BigDecimal.ZERO;
        }

        // 4. Calculate subtotal (sum of line amounts, tax-inclusive, after item discounts)
        BigDecimal taxDivisor = BigDecimal.ONE.add(taxPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CreateSaleItemRequest item : request.getItems()) {
            BigDecimal itemDiscountPct = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
            BigDecimal itemDiscountFactor = BigDecimal.ONE.subtract(itemDiscountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal effectiveUnitPrice = item.getUnitPrice().multiply(itemDiscountFactor).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = effectiveUnitPrice.multiply(BigDecimal.valueOf(item.getQty()));
            subtotal = subtotal.add(lineAmount);
        }

        // 5. Extract GST from subtotal (since MRP is tax-inclusive)
        BigDecimal taxableValue = subtotal.divide(taxDivisor, 2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = subtotal.subtract(taxableValue);

        // 6. Calculate global (additional) discount on subtotal
        BigDecimal discountPercent = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal discountAmount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // 7. Calculate total (final amount payable)
        BigDecimal total = subtotal.subtract(discountAmount);

        // 8. Decrease stock for each item and calculate profit
        // Store avg_cost for each item to use when creating sale items
        Map<CreateSaleItemRequest, BigDecimal> itemCosts = new HashMap<>();
        BigDecimal totalProfit = BigDecimal.ZERO;

        for (CreateSaleItemRequest item : request.getItems()) {
            // Call function which decreases stock and returns avg_cost
            BigDecimal avgCost = saleDao.decreaseVariantStockOnSale(item.getVariantId(), item.getQty());
            itemCosts.put(item, avgCost);

            // Calculate profit for this item (revenue = tax-exclusive base price after item discount)
            BigDecimal itemDiscountPct = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
            BigDecimal itemDiscountFactor = BigDecimal.ONE.subtract(itemDiscountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal effectiveUnitPrice = item.getUnitPrice().multiply(itemDiscountFactor).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = effectiveUnitPrice.multiply(BigDecimal.valueOf(item.getQty()));
            BigDecimal revenue = lineAmount.divide(taxDivisor, 2, RoundingMode.HALF_UP);

            // Apply global discount to revenue (not profit) — discount reduces what we earned, not what we paid
            BigDecimal globalDiscountFactor = BigDecimal.ONE.subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            revenue = revenue.multiply(globalDiscountFactor).setScale(2, RoundingMode.HALF_UP);

            BigDecimal cost = avgCost.multiply(BigDecimal.valueOf(item.getQty()));
            BigDecimal itemProfit = revenue.subtract(cost);
            totalProfit = totalProfit.add(itemProfit);

            log.debug("Stock decreased for variant {}: qty={}, avgCost={}, itemProfit={}", 
                    item.getVariantId(), item.getQty(), avgCost, itemProfit);
        }

        // 9. Create sale record
        OffsetDateTime soldAt = OffsetDateTime.now();
        Long saleId = saleDao.create(
                billNo,
                soldAt,
                request.getCustomerName(),
                request.getCustomerPhone(),
                request.getPaymentMode(),
                subtotal,
                discountPercent,
                discountAmount,
                taxPercent,
                taxAmount,
                total,
                totalProfit,
                createdBy
        );

        log.info("Sale created with ID: {}, Bill No: {}", saleId, billNo);

        // 10. Create sale items
        for (CreateSaleItemRequest item : request.getItems()) {
            BigDecimal unitCostAtSale = itemCosts.get(item);
            BigDecimal itemDiscountPct = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
            saleDao.createItem(
                    saleId,
                    item.getVariantId(),
                    item.getQty(),
                    item.getUnitPrice(),
                    unitCostAtSale,
                    itemDiscountPct
            );
        }

        log.info("Sale completed successfully. Bill No: {}, Total: {}, Profit: {}", billNo, total, totalProfit);

        // Return created sale with details
        return getSaleById(saleId);
    }

    /**
     * Void a sale.
     * This method:
     * 1. Validates sale exists and is not already voided
     * 2. Restores stock for all items
     * 3. Marks sale as VOIDED
     */
    @Transactional
    @Auditable(entity = EntityType.SALE, action = AuditAction.VOID)
    public SaleDetailResponse voidSale(Long id, VoidSaleRequest request, Long voidedBy) {
        log.info("Voiding sale ID: {} with reason: {}", id, request.getReason());

        // 1. Validate sale exists
        SaleWithDetails sale = saleDao.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SALE_NOT_FOUND",
                        "Sale not found with ID: " + id
                ));

        // 2. Check if sale is in COMPLETED status (only COMPLETED sales can be voided)
        if (!"COMPLETED".equals(sale.getStatus())) {
            if ("VOIDED".equals(sale.getStatus())) {
                throw new BadRequestException(
                        "SALE_ALREADY_VOIDED",
                        "Sale " + sale.getBillNo() + " is already voided"
                );
            }
            throw new BadRequestException(
                    "INVALID_SALE_STATUS",
                    "Only COMPLETED sales can be voided. Current status: " + sale.getStatus()
            );
        }

        // 3. Restore stock for all items using PostgreSQL function
        saleDao.restoreStockOnVoid(id);
        log.debug("Stock restored for sale ID: {}", id);

        // 4. Mark sale as voided
        OffsetDateTime voidedAt = OffsetDateTime.now();
        saleDao.voidSale(id, voidedAt, voidedBy, request.getReason());

        log.info("Sale voided successfully. Bill No: {}", sale.getBillNo());

        // Return updated sale with details
        return getSaleById(id);
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
