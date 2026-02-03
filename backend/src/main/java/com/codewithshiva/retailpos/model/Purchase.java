package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Purchase entity representing the purchases table.
 */
@Data
@Builder
@NoArgsConstructor
public class Purchase {
    private Long id;
    private Long supplierId;
    private String invoiceNo;
    private OffsetDateTime purchasedAt;
    private BigDecimal totalCost;
    private String notes;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({"id", "supplierId", "invoiceNo", "purchasedAt", "totalCost", 
                           "notes", "createdBy", "createdAt", "updatedAt"})
    public Purchase(Long id, Long supplierId, String invoiceNo, OffsetDateTime purchasedAt,
                    BigDecimal totalCost, String notes, Long createdBy, 
                    OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.invoiceNo = invoiceNo;
        this.purchasedAt = purchasedAt;
        this.totalCost = totalCost;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
