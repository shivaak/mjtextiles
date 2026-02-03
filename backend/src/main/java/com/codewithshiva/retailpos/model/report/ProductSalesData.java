package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for product sales aggregation.
 */
@Data
@Builder
@NoArgsConstructor
public class ProductSalesData {
    private Long variantId;
    private String productName;
    private String sku;
    private String category;
    private String brand;
    private Long qtySold;
    private BigDecimal revenue;
    private BigDecimal cost;
    private BigDecimal profit;

    @ConstructorProperties({"variantId", "productName", "sku", "category", "brand", 
                           "qtySold", "revenue", "cost", "profit"})
    public ProductSalesData(Long variantId, String productName, String sku, String category, 
                            String brand, Long qtySold, BigDecimal revenue, BigDecimal cost, 
                            BigDecimal profit) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.category = category;
        this.brand = brand;
        this.qtySold = qtySold;
        this.revenue = revenue;
        this.cost = cost;
        this.profit = profit;
    }
}
