package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * SaleItem entity representing the sale_items table.
 */
@Data
@Builder
@NoArgsConstructor
public class SaleItem {
    private Long id;
    private Long saleId;
    private Long variantId;
    private Integer qty;
    private BigDecimal unitPrice;
    private BigDecimal unitCostAtSale;
    private BigDecimal itemDiscountPercent;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "saleId", "variantId", "qty", "unitPrice", "unitCostAtSale",
                           "itemDiscountPercent", "createdAt"})
    public SaleItem(Long id, Long saleId, Long variantId, Integer qty, BigDecimal unitPrice,
                    BigDecimal unitCostAtSale, BigDecimal itemDiscountPercent, OffsetDateTime createdAt) {
        this.id = id;
        this.saleId = saleId;
        this.variantId = variantId;
        this.qty = qty;
        this.unitPrice = unitPrice;
        this.unitCostAtSale = unitCostAtSale;
        this.itemDiscountPercent = itemDiscountPercent;
        this.createdAt = createdAt;
    }
}
