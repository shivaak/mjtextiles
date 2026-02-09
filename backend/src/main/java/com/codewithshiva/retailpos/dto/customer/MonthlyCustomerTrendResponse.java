package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.MonthlyCustomerTrend;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for monthly new customer trend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MonthlyCustomerTrendResponse {
    private String month;
    private Long newCustomers;

    public static MonthlyCustomerTrendResponse fromMonthlyTrend(MonthlyCustomerTrend trend) {
        return MonthlyCustomerTrendResponse.builder()
                .month(trend.getMonth())
                .newCustomers(trend.getNewCustomers())
                .build();
    }
}
