package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;

/**
 * Model for slow moving product data.
 */
@Data
@Builder
@NoArgsConstructor
public class SlowMoverData {
    private Long variantId;
    private String productName;
    private String sku;
    private Long qtySold;
    private Integer daysSinceLastSale;
    private Integer stockQty;

    @ConstructorProperties({"variantId", "productName", "sku", "qtySold", "daysSinceLastSale", "stockQty"})
    public SlowMoverData(Long variantId, String productName, String sku, Long qtySold, 
                         Integer daysSinceLastSale, Integer stockQty) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.qtySold = qtySold;
        this.daysSinceLastSale = daysSinceLastSale;
        this.stockQty = stockQty;
    }
}
