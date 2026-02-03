package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for low stock item with purchase history.
 */
@Data
@Builder
@NoArgsConstructor
public class LowStockItemData {
    private Long variantId;
    private String productName;
    private String sku;
    private String category;
    private String brand;
    private Integer currentStock;
    private Integer threshold;
    private BigDecimal avgMonthlySales;
    private BigDecimal lastPurchasePrice;
    private String lastSupplier;

    @ConstructorProperties({"variantId", "productName", "sku", "category", "brand", 
                           "currentStock", "threshold", "avgMonthlySales", 
                           "lastPurchasePrice", "lastSupplier"})
    public LowStockItemData(Long variantId, String productName, String sku, String category,
                            String brand, Integer currentStock, Integer threshold,
                            BigDecimal avgMonthlySales, BigDecimal lastPurchasePrice,
                            String lastSupplier) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.category = category;
        this.brand = brand;
        this.currentStock = currentStock;
        this.threshold = threshold;
        this.avgMonthlySales = avgMonthlySales;
        this.lastPurchasePrice = lastPurchasePrice;
        this.lastSupplier = lastSupplier;
    }
}
