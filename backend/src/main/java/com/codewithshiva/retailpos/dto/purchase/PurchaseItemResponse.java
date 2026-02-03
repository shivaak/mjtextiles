package com.codewithshiva.retailpos.dto.purchase;

import com.codewithshiva.retailpos.model.PurchaseItemWithVariant;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for purchase item in detail view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseItemResponse {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String variantBarcode;
    private String productName;
    private String size;
    private String color;
    private Integer qty;
    private BigDecimal unitCost;
    private BigDecimal totalCost;

    /**
     * Create PurchaseItemResponse from PurchaseItemWithVariant model.
     */
    public static PurchaseItemResponse fromPurchaseItemWithVariant(PurchaseItemWithVariant item) {
        BigDecimal totalCost = item.getUnitCost().multiply(BigDecimal.valueOf(item.getQty()));
        
        return PurchaseItemResponse.builder()
                .id(item.getId())
                .variantId(item.getVariantId())
                .variantSku(item.getVariantSku())
                .variantBarcode(item.getVariantBarcode())
                .productName(item.getProductName())
                .size(item.getSize())
                .color(item.getColor())
                .qty(item.getQty())
                .unitCost(item.getUnitCost())
                .totalCost(totalCost)
                .build();
    }
}
