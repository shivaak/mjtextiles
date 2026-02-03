package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;

/**
 * Model for low stock item from v_low_stock_variants view.
 */
@Data
@Builder
@NoArgsConstructor
public class LowStockItem {
    private Long variantId;
    private String productName;
    private String sku;
    private String size;
    private String color;
    private Integer stockQty;
    private Integer threshold;

    @ConstructorProperties({"variantId", "productName", "sku", "size", "color", 
                           "stockQty", "threshold"})
    public LowStockItem(Long variantId, String productName, String sku, String size,
                        String color, Integer stockQty, Integer threshold) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.size = size;
        this.color = color;
        this.stockQty = stockQty;
        this.threshold = threshold;
    }
}
