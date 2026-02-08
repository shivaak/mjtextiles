package com.codewithshiva.retailpos.dto.offer;

import com.codewithshiva.retailpos.model.OfferItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for an offer item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OfferItemResponse {
    private Long id;
    private Long productId;
    private Long variantId;
    private Integer minQty;
    private BigDecimal offerPrice;
    private BigDecimal discountPercent;
    private Integer freeQty;
    private String productName;
    private String variantSku;

    public static OfferItemResponse fromOfferItem(OfferItem item) {
        return OfferItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .minQty(item.getMinQty())
                .offerPrice(item.getOfferPrice())
                .discountPercent(item.getDiscountPercent())
                .freeQty(item.getFreeQty())
                .productName(item.getProductName())
                .variantSku(item.getVariantSku())
                .build();
    }
}
