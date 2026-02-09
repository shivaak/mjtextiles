package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.CustomerRanking;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for customer ranking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerRankingResponse {
    private Long customerId;
    private String name;
    private String phone;
    private String area;
    private Long purchaseCount;
    private BigDecimal totalSpent;
    private BigDecimal avgOrderValue;
    private OffsetDateTime lastPurchaseAt;
    private Integer loyaltyPoints;
    private Integer rank;

    public static CustomerRankingResponse fromCustomerRanking(CustomerRanking ranking, int rank) {
        return CustomerRankingResponse.builder()
                .customerId(ranking.getCustomerId())
                .name(ranking.getName())
                .phone(ranking.getPhone())
                .area(ranking.getArea())
                .purchaseCount(ranking.getPurchaseCount())
                .totalSpent(ranking.getTotalSpent() != null ? ranking.getTotalSpent() : BigDecimal.ZERO)
                .avgOrderValue(ranking.getAvgOrderValue() != null ? ranking.getAvgOrderValue() : BigDecimal.ZERO)
                .lastPurchaseAt(ranking.getLastPurchaseAt())
                .loyaltyPoints(ranking.getLoyaltyPoints() != null ? ranking.getLoyaltyPoints() : 0)
                .rank(rank)
                .build();
    }
}
