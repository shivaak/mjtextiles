package com.codewithshiva.retailpos.dto.sale;

import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for sale item in detail view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaleItemResponse {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String variantBarcode;
    private String productName;
    private String size;
    private String color;
    private Integer qty;
    private BigDecimal unitPrice;
    private BigDecimal unitCostAtSale;
    private BigDecimal totalPrice;
    private BigDecimal profit;

    /**
     * Create SaleItemResponse from SaleItemWithVariant model.
     */
    public static SaleItemResponse fromSaleItemWithVariant(SaleItemWithVariant item) {
        BigDecimal totalPrice = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQty()));
        BigDecimal totalCost = item.getUnitCostAtSale().multiply(BigDecimal.valueOf(item.getQty()));
        BigDecimal profit = totalPrice.subtract(totalCost);
        
        return SaleItemResponse.builder()
                .id(item.getId())
                .variantId(item.getVariantId())
                .variantSku(item.getVariantSku())
                .variantBarcode(item.getVariantBarcode())
                .productName(item.getProductName())
                .size(item.getSize())
                .color(item.getColor())
                .qty(item.getQty())
                .unitPrice(item.getUnitPrice())
                .unitCostAtSale(item.getUnitCostAtSale())
                .totalPrice(totalPrice)
                .profit(profit)
                .build();
    }
}
