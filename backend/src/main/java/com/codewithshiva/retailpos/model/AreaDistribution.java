package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for area-wise customer distribution.
 */
@Data
@Builder
@NoArgsConstructor
public class AreaDistribution {
    private String area;
    private Long customerCount;
    private Long activeCustomers;
    private BigDecimal totalRevenue;

    @ConstructorProperties({"area", "customerCount", "activeCustomers", "totalRevenue"})
    public AreaDistribution(String area, Long customerCount, Long activeCustomers, BigDecimal totalRevenue) {
        this.area = area;
        this.customerCount = customerCount;
        this.activeCustomers = activeCustomers;
        this.totalRevenue = totalRevenue;
    }
}
