package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model for customer ranking by purchases/revenue.
 */
@Data
@Builder
@NoArgsConstructor
public class CustomerRanking {
    private Long customerId;
    private String name;
    private String phone;
    private String area;
    private Long purchaseCount;
    private BigDecimal totalSpent;
    private BigDecimal avgOrderValue;
    private OffsetDateTime lastPurchaseAt;
    private Integer loyaltyPoints;

    @ConstructorProperties({"customerId", "name", "phone", "area", "purchaseCount",
                           "totalSpent", "avgOrderValue", "lastPurchaseAt", "loyaltyPoints"})
    public CustomerRanking(Long customerId, String name, String phone, String area,
                           Long purchaseCount, BigDecimal totalSpent, BigDecimal avgOrderValue,
                           OffsetDateTime lastPurchaseAt, Integer loyaltyPoints) {
        this.customerId = customerId;
        this.name = name;
        this.phone = phone;
        this.area = area;
        this.purchaseCount = purchaseCount;
        this.totalSpent = totalSpent;
        this.avgOrderValue = avgOrderValue;
        this.lastPurchaseAt = lastPurchaseAt;
        this.loyaltyPoints = loyaltyPoints;
    }
}
