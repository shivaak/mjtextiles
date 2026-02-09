package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.CustomerDao;
import com.codewithshiva.retailpos.dao.SaleDao;
import com.codewithshiva.retailpos.dao.SettingsDao;
import com.codewithshiva.retailpos.dao.VariantDao;
import com.codewithshiva.retailpos.dto.sale.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Customer;
import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.codewithshiva.retailpos.model.SaleWithDetails;
import com.codewithshiva.retailpos.model.Settings;
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
import java.util.Optional;
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
    private final CustomerDao customerDao;
    private final SettingsDao settingsDao;

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
     * 5. Handles customer lookup/creation
     * 6. Validates and applies points redemption
     * 7. Decreases stock and captures avg_cost for each item
     * 8. Calculates subtotal, discount, tax, total, and profit
     * 9. Creates sale and sale items records
     * 10. Calculates and awards earned points
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

        // 3. Get settings (tax percent + loyalty config)
        Settings settings = settingsDao.get().orElse(null);
        BigDecimal taxPercent = settings != null && settings.getTaxPercent() != null ? settings.getTaxPercent() : BigDecimal.ZERO;
        boolean loyaltyEnabled = settings != null && Boolean.TRUE.equals(settings.getLoyaltyEnabled());

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

        // 7. Calculate total (before points redemption)
        BigDecimal total = subtotal.subtract(discountAmount);

        // 8. Handle customer lookup/creation
        Long customerId = null;
        Customer customer = null;
        String customerPhone = request.getCustomerPhone();
        String customerName = request.getCustomerName();

        if (customerPhone != null && !customerPhone.trim().isEmpty()) {
            Optional<Customer> existingCustomer = customerDao.findByPhone(customerPhone.trim());
            if (existingCustomer.isPresent()) {
                customer = existingCustomer.get();
                customerId = customer.getId();
                // Update name if provided and different
                if (customerName != null && !customerName.trim().isEmpty() && !customerName.equals(customer.getName())) {
                    customerDao.update(customerId, customerPhone.trim(), customerName.trim());
                }
                log.debug("Found existing customer ID: {} for phone: {}", customerId, customerPhone);
            } else if (customerName != null && !customerName.trim().isEmpty()) {
                // Create new customer
                customerId = customerDao.create(customerPhone.trim(), customerName.trim());
                customer = customerDao.findById(customerId).orElse(null);
                log.info("Created new customer ID: {} for phone: {}", customerId, customerPhone);
            }
        }

        // 9. Validate and calculate points redemption
        int pointsToRedeem = 0;
        BigDecimal pointsRedemptionAmount = BigDecimal.ZERO;
        BigDecimal pointValue = settings != null && settings.getPointValue() != null ? settings.getPointValue() : BigDecimal.ONE;

        if (request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
            if (!loyaltyEnabled) {
                throw new BadRequestException("LOYALTY_DISABLED", "Loyalty program is not enabled");
            }
            if (customer == null) {
                throw new BadRequestException("CUSTOMER_REQUIRED", "Customer is required to redeem points");
            }

            pointsToRedeem = request.getPointsToRedeem();

            // Validate customer has enough points
            if (pointsToRedeem > customer.getLoyaltyPoints()) {
                throw new BadRequestException("INSUFFICIENT_POINTS",
                        String.format("Customer has %d points, but tried to redeem %d", customer.getLoyaltyPoints(), pointsToRedeem));
            }

            // Validate max redemption percent
            BigDecimal maxRedemptionPercent = settings.getMaxPointsRedemptionPercent() != null
                    ? settings.getMaxPointsRedemptionPercent() : BigDecimal.valueOf(50);
            BigDecimal maxRedemptionAmount = total.multiply(maxRedemptionPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            int maxRedeemablePoints = maxRedemptionAmount.divide(pointValue, 0, RoundingMode.FLOOR).intValue();

            if (pointsToRedeem > maxRedeemablePoints) {
                throw new BadRequestException("EXCEEDS_MAX_REDEMPTION",
                        String.format("Maximum redeemable points for this bill is %d (%.0f%% of total)", maxRedeemablePoints, maxRedemptionPercent));
            }

            pointsRedemptionAmount = pointValue.multiply(BigDecimal.valueOf(pointsToRedeem)).setScale(2, RoundingMode.HALF_UP);
            log.debug("Points redemption: {} points = {} amount", pointsToRedeem, pointsRedemptionAmount);
        }

        // 10. Decrease stock for each item and calculate profit
        Map<CreateSaleItemRequest, BigDecimal> itemCosts = new HashMap<>();
        BigDecimal totalProfit = BigDecimal.ZERO;

        for (CreateSaleItemRequest item : request.getItems()) {
            BigDecimal avgCost = saleDao.decreaseVariantStockOnSale(item.getVariantId(), item.getQty());
            itemCosts.put(item, avgCost);

            BigDecimal itemDiscountPct = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
            BigDecimal itemDiscountFactor = BigDecimal.ONE.subtract(itemDiscountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal effectiveUnitPrice = item.getUnitPrice().multiply(itemDiscountFactor).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = effectiveUnitPrice.multiply(BigDecimal.valueOf(item.getQty()));
            BigDecimal revenue = lineAmount.divide(taxDivisor, 2, RoundingMode.HALF_UP);

            BigDecimal globalDiscountFactor = BigDecimal.ONE.subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            revenue = revenue.multiply(globalDiscountFactor).setScale(2, RoundingMode.HALF_UP);

            BigDecimal cost = avgCost.multiply(BigDecimal.valueOf(item.getQty()));
            BigDecimal itemProfit = revenue.subtract(cost);
            totalProfit = totalProfit.add(itemProfit);

            log.debug("Stock decreased for variant {}: qty={}, avgCost={}, itemProfit={}", 
                    item.getVariantId(), item.getQty(), avgCost, itemProfit);
        }

        // Adjust profit for points redemption (points redemption reduces revenue)
        if (pointsRedemptionAmount.compareTo(BigDecimal.ZERO) > 0) {
            totalProfit = totalProfit.subtract(pointsRedemptionAmount);
        }

        // 11. Calculate earned points
        int pointsEarned = 0;
        if (loyaltyEnabled && customer != null && settings != null) {
            BigDecimal minPurchase = settings.getPointsMinPurchaseAmount() != null
                    ? settings.getPointsMinPurchaseAmount() : BigDecimal.valueOf(500);
            BigDecimal pointsPerHundred = settings.getPointsPerHundred() != null
                    ? settings.getPointsPerHundred() : BigDecimal.ONE;

            if (total.compareTo(minPurchase) >= 0) {
                pointsEarned = total.divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR)
                        .multiply(pointsPerHundred)
                        .intValue();
            }
            log.debug("Points earned: {} (total: {}, minPurchase: {})", pointsEarned, total, minPurchase);
        }

        // 12. Create sale record
        OffsetDateTime soldAt = OffsetDateTime.now();
        Long saleId = saleDao.create(
                billNo,
                soldAt,
                customerId,
                request.getPaymentMode(),
                subtotal,
                discountPercent,
                discountAmount,
                taxPercent,
                taxAmount,
                total,
                totalProfit,
                pointsEarned,
                pointsToRedeem,
                pointsRedemptionAmount,
                createdBy
        );

        log.info("Sale created with ID: {}, Bill No: {}", saleId, billNo);

        // 13. Create sale items
        for (CreateSaleItemRequest item : request.getItems()) {
            BigDecimal unitCostAtSale = itemCosts.get(item);
            BigDecimal itemDiscountPct = item.getItemDiscountPercent() != null ? item.getItemDiscountPercent() : BigDecimal.ZERO;
            saleDao.createItem(
                    saleId,
                    item.getVariantId(),
                    item.getQty(),
                    item.getUnitPrice(),
                    unitCostAtSale,
                    itemDiscountPct,
                    item.getAppliedOfferId()
            );
        }

        // 14. Handle loyalty points transactions
        if (customer != null) {
            // Redeem points
            if (pointsToRedeem > 0) {
                customerDao.redeemPoints(customerId, pointsToRedeem);
                customerDao.createPointsLog(customerId, saleId, "REDEEMED", pointsToRedeem,
                        String.format("Redeemed %d points on bill %s (-%s)", pointsToRedeem, billNo, pointsRedemptionAmount),
                        createdBy);
                log.info("Redeemed {} points for customer ID: {}", pointsToRedeem, customerId);
            }

            // Earn points
            if (pointsEarned > 0) {
                customerDao.addPoints(customerId, pointsEarned);
                customerDao.createPointsLog(customerId, saleId, "EARNED", pointsEarned,
                        String.format("Earned %d points on bill %s (total: %s)", pointsEarned, billNo, total),
                        createdBy);
                log.info("Awarded {} points to customer ID: {}", pointsEarned, customerId);
            }
        }

        log.info("Sale completed successfully. Bill No: {}, Total: {}, Profit: {}, Points Earned: {}, Points Redeemed: {}",
                billNo, total, totalProfit, pointsEarned, pointsToRedeem);

        // Return created sale with details
        return getSaleById(saleId);
    }

    /**
     * Void a sale.
     * This method:
     * 1. Validates sale exists and is not already voided
     * 2. Restores stock for all items
     * 3. Reverses loyalty points (earned and redeemed)
     * 4. Marks sale as VOIDED
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

        // 4. Reverse loyalty points if customer was linked
        if (sale.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerDao.findById(sale.getCustomerId());
            if (customerOpt.isPresent()) {
                // Reverse earned points (deduct from balance)
                if (sale.getPointsEarned() != null && sale.getPointsEarned() > 0) {
                    customerDao.reverseEarnedPoints(sale.getCustomerId(), sale.getPointsEarned());
                    customerDao.createPointsLog(sale.getCustomerId(), id, "VOID_REVERSAL",
                            -sale.getPointsEarned(),
                            String.format("Reversed %d earned points due to void of bill %s", sale.getPointsEarned(), sale.getBillNo()),
                            voidedBy);
                    log.info("Reversed {} earned points for customer ID: {}", sale.getPointsEarned(), sale.getCustomerId());
                }

                // Reverse redeemed points (add back to balance)
                if (sale.getPointsRedeemed() != null && sale.getPointsRedeemed() > 0) {
                    customerDao.reverseRedeemedPoints(sale.getCustomerId(), sale.getPointsRedeemed());
                    customerDao.createPointsLog(sale.getCustomerId(), id, "VOID_REVERSAL",
                            sale.getPointsRedeemed(),
                            String.format("Refunded %d redeemed points due to void of bill %s", sale.getPointsRedeemed(), sale.getBillNo()),
                            voidedBy);
                    log.info("Refunded {} redeemed points to customer ID: {}", sale.getPointsRedeemed(), sale.getCustomerId());
                }
            }
        }

        // 5. Mark sale as voided
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
