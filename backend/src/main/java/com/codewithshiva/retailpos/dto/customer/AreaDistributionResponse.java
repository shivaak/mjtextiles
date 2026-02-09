package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.AreaDistribution;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for area-wise customer distribution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AreaDistributionResponse {
    private String area;
    private Long customerCount;
    private Long activeCustomers;
    private BigDecimal totalRevenue;

    public static AreaDistributionResponse fromAreaDistribution(AreaDistribution dist) {
        return AreaDistributionResponse.builder()
                .area(dist.getArea())
                .customerCount(dist.getCustomerCount())
                .activeCustomers(dist.getActiveCustomers())
                .totalRevenue(dist.getTotalRevenue() != null ? dist.getTotalRevenue() : BigDecimal.ZERO)
                .build();
    }
}
