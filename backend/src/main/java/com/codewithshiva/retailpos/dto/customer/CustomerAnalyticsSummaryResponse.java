package com.codewithshiva.retailpos.dto.customer;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for customer analytics summary.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerAnalyticsSummaryResponse {
    private Long totalCustomers;
    private Long customersWithPurchases;
    private BigDecimal totalRevenue;
    private BigDecimal avgOrderValue;
    private Long totalTransactions;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private Integer totalPointsBalance;
    private Long repeatCustomers;
    private Double repeatRate;
}
