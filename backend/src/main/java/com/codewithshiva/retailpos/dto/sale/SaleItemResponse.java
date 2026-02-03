package com.codewithshiva.retailpos.dto.sale;

import com.codewithshiva.retailpos.dto.Views;
import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
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
    @JsonView(Views.Employee.class)
    private Long id;
    @JsonView(Views.Employee.class)
    private Long variantId;
    @JsonView(Views.Employee.class)
    private String variantSku;
    @JsonView(Views.Employee.class)
    private String variantBarcode;
    @JsonView(Views.Employee.class)
    private String productName;
    @JsonView(Views.Employee.class)
    private String size;
    @JsonView(Views.Employee.class)
    private String color;
    @JsonView(Views.Employee.class)
    private Integer qty;
    @JsonView(Views.Employee.class)
    private BigDecimal unitPrice;
    @JsonView(Views.Admin.class) // Only visible to ADMIN
    private BigDecimal unitCostAtSale;
    @JsonView(Views.Employee.class)
    private BigDecimal totalPrice;
    @JsonView(Views.Admin.class) // Only visible to ADMIN
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
