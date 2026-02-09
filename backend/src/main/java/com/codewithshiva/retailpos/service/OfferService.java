package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.OfferDao;
import com.codewithshiva.retailpos.dto.offer.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Offer;
import com.codewithshiva.retailpos.model.OfferItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for offer management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OfferService {

    private static final Set<String> VALID_OFFER_TYPES = Set.of(
            "QUANTITY_PRICE", "QUANTITY_DISCOUNT", "COMBO", "BOGO"
    );

    private final OfferDao offerDao;

    /**
     * List all offers with their items.
     */
    @Transactional(readOnly = true)
    public List<OfferResponse> listOffers() {
        log.debug("Listing all offers");
        List<Offer> offers = offerDao.findAll();
        return offers.stream()
                .map(offer -> {
                    List<OfferItem> items = offerDao.findItemsByOfferId(offer.getId());
                    return OfferResponse.fromOffer(offer, items);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get offer by ID with items.
     */
    @Transactional(readOnly = true)
    public OfferResponse getOfferById(Long id) {
        log.debug("Getting offer by ID: {}", id);
        Offer offer = offerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OFFER_NOT_FOUND", "Offer not found with ID: " + id));
        List<OfferItem> items = offerDao.findItemsByOfferId(id);
        return OfferResponse.fromOffer(offer, items);
    }

    /**
     * Get all active, date-valid offers with items (for billing page).
     */
    @Transactional(readOnly = true)
    public List<OfferResponse> getActiveOffers() {
        log.debug("Getting active offers");
        List<Offer> offers = offerDao.findActiveOffers();
        return offers.stream()
                .map(offer -> {
                    List<OfferItem> items = offerDao.findItemsByOfferId(offer.getId());
                    return OfferResponse.fromOffer(offer, items);
                })
                .collect(Collectors.toList());
    }

    /**
     * Create a new offer with items.
     */
    @Transactional
    public OfferResponse createOffer(CreateOfferRequest request, Long createdBy) {
        log.info("Creating offer: {} (type: {})", request.getName(), request.getOfferType());

        validateOfferType(request.getOfferType());
        validateOfferRequest(request.getOfferType(), request.getItems(), request.getComboPrice(),
                request.getBuyQty(), request.getFreeQty());

        boolean isActive = request.getIsActive() != null ? request.getIsActive() : true;

        Long offerId = offerDao.create(
                request.getName(),
                request.getOfferType(),
                isActive,
                request.getStartDate(),
                request.getEndDate(),
                request.getComboPrice(),
                request.getBuyQty(),
                request.getFreeQty(),
                request.getPriority() != null ? request.getPriority() : 0,
                createdBy
        );

        // Create offer items
        for (OfferItemRequest item : request.getItems()) {
            offerDao.createItem(
                    offerId,
                    item.getProductId(),
                    item.getVariantId(),
                    item.getMinQty() != null ? item.getMinQty() : 1,
                    item.getOfferPrice(),
                    item.getDiscountPercent(),
                    item.getFreeQty() != null ? item.getFreeQty() : 0
            );
        }

        log.info("Offer created successfully with ID: {}", offerId);
        return getOfferById(offerId);
    }

    /**
     * Update an existing offer with items.
     */
    @Transactional
    public OfferResponse updateOffer(Long id, UpdateOfferRequest request) {
        log.info("Updating offer with ID: {}", id);

        Offer existing = offerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OFFER_NOT_FOUND", "Offer not found with ID: " + id));

        validateOfferType(request.getOfferType());
        validateOfferRequest(request.getOfferType(), request.getItems(), request.getComboPrice(),
                request.getBuyQty(), request.getFreeQty());

        boolean isActive = request.getIsActive() != null ? request.getIsActive() : existing.isActive();

        offerDao.update(
                id,
                request.getName(),
                request.getOfferType(),
                isActive,
                request.getStartDate(),
                request.getEndDate(),
                request.getComboPrice(),
                request.getBuyQty(),
                request.getFreeQty(),
                request.getPriority() != null ? request.getPriority() : existing.getPriority()
        );

        // Replace offer items
        offerDao.deleteItemsByOfferId(id);
        for (OfferItemRequest item : request.getItems()) {
            offerDao.createItem(
                    id,
                    item.getProductId(),
                    item.getVariantId(),
                    item.getMinQty() != null ? item.getMinQty() : 1,
                    item.getOfferPrice(),
                    item.getDiscountPercent(),
                    item.getFreeQty() != null ? item.getFreeQty() : 0
            );
        }

        log.info("Offer updated successfully: {}", id);
        return getOfferById(id);
    }

    /**
     * Toggle offer active status.
     */
    @Transactional
    public OfferResponse toggleOfferStatus(Long id) {
        log.info("Toggling offer status for ID: {}", id);
        Offer offer = offerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OFFER_NOT_FOUND", "Offer not found with ID: " + id));

        offerDao.updateActiveStatus(id, !offer.isActive());
        log.info("Offer {} is now {}", id, !offer.isActive() ? "active" : "inactive");
        return getOfferById(id);
    }

    /**
     * Delete an offer.
     */
    @Transactional
    public void deleteOffer(Long id) {
        log.info("Deleting offer with ID: {}", id);
        offerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OFFER_NOT_FOUND", "Offer not found with ID: " + id));
        offerDao.deleteById(id);
        log.info("Offer deleted: {}", id);
    }

    // ==========================================
    // Validation helpers
    // ==========================================

    private void validateOfferType(String offerType) {
        if (!VALID_OFFER_TYPES.contains(offerType)) {
            throw new BadRequestException("INVALID_OFFER_TYPE",
                    "Invalid offer type: " + offerType + ". Must be one of: " + VALID_OFFER_TYPES);
        }
    }

    private void validateOfferRequest(String offerType, List<OfferItemRequest> items,
                                       java.math.BigDecimal comboPrice, Integer buyQty, Integer freeQty) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("MISSING_OFFER_ITEMS", "At least one offer item is required");
        }

        // Validate each item has either productId or variantId
        for (OfferItemRequest item : items) {
            if (item.getProductId() == null && item.getVariantId() == null) {
                throw new BadRequestException("INVALID_OFFER_ITEM",
                        "Each offer item must have either a productId or variantId");
            }
            if (item.getProductId() != null && item.getVariantId() != null) {
                throw new BadRequestException("INVALID_OFFER_ITEM",
                        "Each offer item must have either productId or variantId, not both");
            }
        }

        switch (offerType) {
            case "QUANTITY_PRICE":
                for (OfferItemRequest item : items) {
                    if (item.getOfferPrice() == null) {
                        throw new BadRequestException("MISSING_OFFER_PRICE",
                                "Each QUANTITY_PRICE offer item must have an offer price");
                    }
                }
                break;

            case "QUANTITY_DISCOUNT":
                for (OfferItemRequest item : items) {
                    if (item.getDiscountPercent() == null) {
                        throw new BadRequestException("MISSING_DISCOUNT_PERCENT",
                                "Each QUANTITY_DISCOUNT offer item must have a discount percent");
                    }
                }
                break;

            case "COMBO":
                if (items.size() < 2) {
                    throw new BadRequestException("INVALID_OFFER_ITEMS",
                            "COMBO offer must have at least two items");
                }
                if (comboPrice == null) {
                    throw new BadRequestException("MISSING_COMBO_PRICE",
                            "COMBO offer must have a combo price");
                }
                break;

            case "BOGO":
                // BOGO uses offer-level buyQty and freeQty; items define the eligible product pool
                if (buyQty == null || buyQty <= 0) {
                    throw new BadRequestException("MISSING_BUY_QTY",
                            "BOGO offer must have a buy quantity greater than 0");
                }
                if (freeQty == null || freeQty <= 0) {
                    throw new BadRequestException("MISSING_FREE_QTY",
                            "BOGO offer must have a free quantity greater than 0");
                }
                break;
        }
    }
}
