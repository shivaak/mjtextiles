package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model representing inventory summary from get_inventory_summary() function.
 */
@Data
@Builder
@NoArgsConstructor
public class InventorySummary {
    private Long totalSkus;
    private Long totalItems;
    private BigDecimal totalCostValue;
    private BigDecimal totalRetailValue;
    private Long lowStockCount;
    private Long outOfStockCount;

    @ConstructorProperties({"totalSkus", "totalItems", "totalCostValue", "totalRetailValue", 
                           "lowStockCount", "outOfStockCount"})
    public InventorySummary(Long totalSkus, Long totalItems, BigDecimal totalCostValue,
                            BigDecimal totalRetailValue, Long lowStockCount, Long outOfStockCount) {
        this.totalSkus = totalSkus;
        this.totalItems = totalItems;
        this.totalCostValue = totalCostValue;
        this.totalRetailValue = totalRetailValue;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
    }
}
