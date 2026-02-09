package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for customer analytics summary stats.
 */
@Data
@Builder
@NoArgsConstructor
public class CustomerAnalyticsSummary {
    private Long totalCustomers;
    private Long customersWithPurchases;
    private BigDecimal totalRevenue;
    private BigDecimal avgOrderValue;
    private Long totalTransactions;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private Integer totalPointsBalance;
    private Long repeatCustomers;

    @ConstructorProperties({"totalCustomers", "customersWithPurchases", "totalRevenue",
                           "avgOrderValue", "totalTransactions", "totalPointsEarned",
                           "totalPointsRedeemed", "totalPointsBalance", "repeatCustomers"})
    public CustomerAnalyticsSummary(Long totalCustomers, Long customersWithPurchases,
                                    BigDecimal totalRevenue, BigDecimal avgOrderValue,
                                    Long totalTransactions, Integer totalPointsEarned,
                                    Integer totalPointsRedeemed, Integer totalPointsBalance,
                                    Long repeatCustomers) {
        this.totalCustomers = totalCustomers;
        this.customersWithPurchases = customersWithPurchases;
        this.totalRevenue = totalRevenue;
        this.avgOrderValue = avgOrderValue;
        this.totalTransactions = totalTransactions;
        this.totalPointsEarned = totalPointsEarned;
        this.totalPointsRedeemed = totalPointsRedeemed;
        this.totalPointsBalance = totalPointsBalance;
        this.repeatCustomers = repeatCustomers;
    }
}
