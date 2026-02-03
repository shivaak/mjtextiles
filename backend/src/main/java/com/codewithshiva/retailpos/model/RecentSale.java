package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model for recent sale summary.
 */
@Data
@Builder
@NoArgsConstructor
public class RecentSale {
    private Long id;
    private String billNo;
    private OffsetDateTime soldAt;
    private String customerName;
    private BigDecimal total;
    private Integer itemCount;
    private String paymentMode;
    private String status;

    @ConstructorProperties({"id", "billNo", "soldAt", "customerName", "total", 
                           "itemCount", "paymentMode", "status"})
    public RecentSale(Long id, String billNo, OffsetDateTime soldAt, String customerName,
                      BigDecimal total, Integer itemCount, String paymentMode, String status) {
        this.id = id;
        this.billNo = billNo;
        this.soldAt = soldAt;
        this.customerName = customerName;
        this.total = total;
        this.itemCount = itemCount;
        this.paymentMode = paymentMode;
        this.status = status;
    }
}
