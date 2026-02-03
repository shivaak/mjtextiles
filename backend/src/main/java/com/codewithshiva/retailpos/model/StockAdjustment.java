package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * StockAdjustment entity representing the stock_adjustments table.
 */
@Data
@Builder
@NoArgsConstructor
public class StockAdjustment {
    private Long id;
    private Long variantId;
    private Integer deltaQty;
    private String reason;
    private String notes;
    private Long createdBy;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "variantId", "deltaQty", "reason", "notes", "createdBy", "createdAt"})
    public StockAdjustment(Long id, Long variantId, Integer deltaQty, String reason,
                           String notes, Long createdBy, OffsetDateTime createdAt) {
        this.id = id;
        this.variantId = variantId;
        this.deltaQty = deltaQty;
        this.reason = reason;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
