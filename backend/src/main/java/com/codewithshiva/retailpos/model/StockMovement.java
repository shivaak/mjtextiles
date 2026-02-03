package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model representing stock movement from v_stock_movements view.
 */
@Data
@Builder
@NoArgsConstructor
public class StockMovement {
    private Long id;
    private Long variantId;
    private String movementType;
    private OffsetDateTime movementDate;
    private Integer deltaQty;
    private Long referenceId;
    private String referenceNo;
    private String supplierName;
    private BigDecimal unitCost;
    private String notes;
    private Long createdBy;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "variantId", "movementType", "movementDate", "deltaQty",
                           "referenceId", "referenceNo", "supplierName", "unitCost", 
                           "notes", "createdBy", "createdAt"})
    public StockMovement(Long id, Long variantId, String movementType, OffsetDateTime movementDate,
                         Integer deltaQty, Long referenceId, String referenceNo, String supplierName,
                         BigDecimal unitCost, String notes, Long createdBy, OffsetDateTime createdAt) {
        this.id = id;
        this.variantId = variantId;
        this.movementType = movementType;
        this.movementDate = movementDate;
        this.deltaQty = deltaQty;
        this.referenceId = referenceId;
        this.referenceNo = referenceNo;
        this.supplierName = supplierName;
        this.unitCost = unitCost;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
