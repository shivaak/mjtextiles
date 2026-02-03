package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for top selling product/variant.
 */
@Data
@Builder
@NoArgsConstructor
public class TopSellingProduct {
    private Long variantId;
    private String productName;
    private String sku;
    private String size;
    private String color;
    private Long qtySold;
    private BigDecimal revenue;
    private BigDecimal profit;

    @ConstructorProperties({"variantId", "productName", "sku", "size", "color", 
                           "qtySold", "revenue", "profit"})
    public TopSellingProduct(Long variantId, String productName, String sku, String size,
                             String color, Long qtySold, BigDecimal revenue, BigDecimal profit) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.size = size;
        this.color = color;
        this.qtySold = qtySold;
        this.revenue = revenue;
        this.profit = profit;
    }
}
