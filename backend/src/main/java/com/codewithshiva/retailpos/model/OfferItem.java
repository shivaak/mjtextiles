package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * OfferItem entity representing the offer_items table.
 */
@Data
@Builder
@NoArgsConstructor
public class OfferItem {
    private Long id;
    private Long offerId;
    private Long productId;
    private Long variantId;
    private Integer minQty;
    private BigDecimal offerPrice;
    private BigDecimal discountPercent;
    private Integer freeQty;

    // Additional fields from joins (for display)
    private String productName;
    private String variantSku;
    private Long variantProductId;

    @ConstructorProperties({"id", "offerId", "productId", "variantId", "minQty",
                           "offerPrice", "discountPercent", "freeQty", "productName", "variantSku",
                           "variantProductId"})
    public OfferItem(Long id, Long offerId, Long productId, Long variantId, Integer minQty,
                     BigDecimal offerPrice, BigDecimal discountPercent, Integer freeQty,
                     String productName, String variantSku, Long variantProductId) {
        this.id = id;
        this.offerId = offerId;
        this.productId = productId;
        this.variantId = variantId;
        this.minQty = minQty;
        this.offerPrice = offerPrice;
        this.discountPercent = discountPercent;
        this.freeQty = freeQty;
        this.productName = productName;
        this.variantSku = variantSku;
        this.variantProductId = variantProductId;
    }
}
