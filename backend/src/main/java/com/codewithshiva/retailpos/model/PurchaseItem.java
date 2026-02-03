package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * PurchaseItem entity representing the purchase_items table.
 */
@Data
@Builder
@NoArgsConstructor
public class PurchaseItem {
    private Long id;
    private Long purchaseId;
    private Long variantId;
    private Integer qty;
    private BigDecimal unitCost;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "purchaseId", "variantId", "qty", "unitCost", "createdAt"})
    public PurchaseItem(Long id, Long purchaseId, Long variantId, Integer qty, 
                        BigDecimal unitCost, OffsetDateTime createdAt) {
        this.id = id;
        this.purchaseId = purchaseId;
        this.variantId = variantId;
        this.qty = qty;
        this.unitCost = unitCost;
        this.createdAt = createdAt;
    }
}
