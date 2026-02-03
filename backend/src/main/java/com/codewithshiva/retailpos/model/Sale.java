package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Sale entity representing the sales table.
 */
@Data
@Builder
@NoArgsConstructor
public class Sale {
    private Long id;
    private String billNo;
    private OffsetDateTime soldAt;
    private String customerName;
    private String customerPhone;
    private String paymentMode;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private BigDecimal profit;
    private String status;
    private OffsetDateTime voidedAt;
    private Long voidedBy;
    private String voidReason;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({"id", "billNo", "soldAt", "customerName", "customerPhone", "paymentMode",
                           "subtotal", "discountPercent", "discountAmount", "taxPercent", "taxAmount",
                           "total", "profit", "status", "voidedAt", "voidedBy", "voidReason",
                           "createdBy", "createdAt", "updatedAt"})
    public Sale(Long id, String billNo, OffsetDateTime soldAt, String customerName, String customerPhone,
                String paymentMode, BigDecimal subtotal, BigDecimal discountPercent, BigDecimal discountAmount,
                BigDecimal taxPercent, BigDecimal taxAmount, BigDecimal total, BigDecimal profit,
                String status, OffsetDateTime voidedAt, Long voidedBy, String voidReason,
                Long createdBy, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.billNo = billNo;
        this.soldAt = soldAt;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.paymentMode = paymentMode;
        this.subtotal = subtotal;
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
        this.taxPercent = taxPercent;
        this.taxAmount = taxAmount;
        this.total = total;
        this.profit = profit;
        this.status = status;
        this.voidedAt = voidedAt;
        this.voidedBy = voidedBy;
        this.voidReason = voidReason;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
