package com.codewithshiva.retailpos.dto.product;

import com.codewithshiva.retailpos.model.Variant;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for variant (embedded in ProductDetailResponse).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VariantResponse {
    private Long id;
    private String sku;
    private String barcode;
    private String size;
    private String color;
    private BigDecimal sellingPrice;
    private BigDecimal avgCost;
    private Integer stockQty;
    private String status;

    /**
     * Create VariantResponse from Variant entity.
     */
    public static VariantResponse fromVariant(Variant variant) {
        return VariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .barcode(variant.getBarcode())
                .size(variant.getSize())
                .color(variant.getColor())
                .sellingPrice(variant.getSellingPrice())
                .avgCost(variant.getAvgCost())
                .stockQty(variant.getStockQty())
                .status(variant.getStatus())
                .build();
    }
}
