package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model representing supplier summary for a variant.
 */
@Data
@Builder
@NoArgsConstructor
public class SupplierSummary {
    private Long supplierId;
    private String supplierName;
    private Long totalQty;
    private Long purchaseCount;
    private OffsetDateTime lastPurchaseDate;
    private BigDecimal avgUnitCost;

    @ConstructorProperties({"supplierId", "supplierName", "totalQty", "purchaseCount", 
                           "lastPurchaseDate", "avgUnitCost"})
    public SupplierSummary(Long supplierId, String supplierName, Long totalQty, Long purchaseCount,
                           OffsetDateTime lastPurchaseDate, BigDecimal avgUnitCost) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.totalQty = totalQty;
        this.purchaseCount = purchaseCount;
        this.lastPurchaseDate = lastPurchaseDate;
        this.avgUnitCost = avgUnitCost;
    }
}
