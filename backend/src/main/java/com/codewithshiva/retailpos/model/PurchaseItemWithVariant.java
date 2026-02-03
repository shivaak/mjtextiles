package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model representing purchase item with variant and product information.
 */
@Data
@Builder
@NoArgsConstructor
public class PurchaseItemWithVariant {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String variantBarcode;
    private String productName;
    private String size;
    private String color;
    private Integer qty;
    private BigDecimal unitCost;

    @ConstructorProperties({"id", "variantId", "variantSku", "variantBarcode", "productName", 
                           "size", "color", "qty", "unitCost"})
    public PurchaseItemWithVariant(Long id, Long variantId, String variantSku, String variantBarcode,
                                   String productName, String size, String color,
                                   Integer qty, BigDecimal unitCost) {
        this.id = id;
        this.variantId = variantId;
        this.variantSku = variantSku;
        this.variantBarcode = variantBarcode;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.qty = qty;
        this.unitCost = unitCost;
    }
}
