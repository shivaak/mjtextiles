package com.codewithshiva.retailpos.dto.variant;

import com.codewithshiva.retailpos.model.VariantWithProduct;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Simplified response DTO for POS variant search and barcode lookup.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VariantSearchResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productBrand;
    private String sku;
    private String barcode;
    private String size;
    private String color;
    private String fabric;
    private String variantType;
    private BigDecimal sellingPrice;
    private BigDecimal avgCost;
    private Integer stockQty;
    private String status;
    private BigDecimal effectiveDiscountPercent;

    /**
     * Create VariantSearchResponse from VariantWithProduct model.
     */
    public static VariantSearchResponse fromVariantWithProduct(VariantWithProduct variant) {
        return VariantSearchResponse.builder()
                .id(variant.getId())
                .productId(variant.getProductId())
                .productName(variant.getProductName())
                .productBrand(variant.getProductBrand())
                .sku(variant.getSku())
                .barcode(variant.getBarcode())
                .size(variant.getSize())
                .color(variant.getColor())
                .fabric(variant.getFabric())
                .variantType(variant.getVariantType())
                .sellingPrice(variant.getSellingPrice())
                .avgCost(variant.getAvgCost())
                .stockQty(variant.getStockQty())
                .status(variant.getStatus())
                .effectiveDiscountPercent(variant.getEffectiveDiscountPercent())
                .build();
    }
}
