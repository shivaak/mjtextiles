package com.codewithshiva.retailpos.dto.variant;

import com.codewithshiva.retailpos.model.VariantWithProduct;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for variant detail view with product information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VariantDetailResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productBrand;
    private String productCategory;
    private String productHsn;
    private String sku;
    private String barcode;
    private String size;
    private String color;
    private BigDecimal sellingPrice;
    private BigDecimal avgCost;
    private Integer stockQty;
    private String status;
    private BigDecimal effectiveDiscountPercent;
    private OffsetDateTime createdAt;

    /**
     * Create VariantDetailResponse from VariantWithProduct model.
     */
    public static VariantDetailResponse fromVariantWithProduct(VariantWithProduct variant) {
        return VariantDetailResponse.builder()
                .id(variant.getId())
                .productId(variant.getProductId())
                .productName(variant.getProductName())
                .productBrand(variant.getProductBrand())
                .productCategory(variant.getProductCategory())
                .productHsn(variant.getProductHsn())
                .sku(variant.getSku())
                .barcode(variant.getBarcode())
                .size(variant.getSize())
                .color(variant.getColor())
                .sellingPrice(variant.getSellingPrice())
                .avgCost(variant.getAvgCost())
                .stockQty(variant.getStockQty())
                .status(variant.getStatus())
                .effectiveDiscountPercent(variant.getEffectiveDiscountPercent())
                .createdAt(variant.getCreatedAt())
                .build();
    }
}
