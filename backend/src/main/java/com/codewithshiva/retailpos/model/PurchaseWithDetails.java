package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model representing purchase with details from v_purchases_with_details view.
 */
@Data
@Builder
@NoArgsConstructor
public class PurchaseWithDetails {
    private Long id;
    private Long supplierId;
    private String invoiceNo;
    private OffsetDateTime purchasedAt;
    private BigDecimal totalCost;
    private String notes;
    private String status;
    private OffsetDateTime voidedAt;
    private Long voidedBy;
    private String voidReason;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String supplierName;
    private String createdByName;
    private String voidedByName;
    private Integer itemCount;

    @ConstructorProperties({"id", "supplierId", "invoiceNo", "purchasedAt", "totalCost", 
                           "notes", "status", "voidedAt", "voidedBy", "voidReason",
                           "createdBy", "createdAt", "updatedAt", 
                           "supplierName", "createdByName", "voidedByName", "itemCount"})
    public PurchaseWithDetails(Long id, Long supplierId, String invoiceNo, OffsetDateTime purchasedAt,
                               BigDecimal totalCost, String notes, String status, OffsetDateTime voidedAt,
                               Long voidedBy, String voidReason, Long createdBy,
                               OffsetDateTime createdAt, OffsetDateTime updatedAt,
                               String supplierName, String createdByName, String voidedByName,
                               Integer itemCount) {
        this.id = id;
        this.supplierId = supplierId;
        this.invoiceNo = invoiceNo;
        this.purchasedAt = purchasedAt;
        this.totalCost = totalCost;
        this.notes = notes;
        this.status = status;
        this.voidedAt = voidedAt;
        this.voidedBy = voidedBy;
        this.voidReason = voidReason;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.supplierName = supplierName;
        this.createdByName = createdByName;
        this.voidedByName = voidedByName;
        this.itemCount = itemCount;
    }
}
