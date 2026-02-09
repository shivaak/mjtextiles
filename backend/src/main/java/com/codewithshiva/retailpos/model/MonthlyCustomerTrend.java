package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;

/**
 * Model for monthly new customer trend.
 */
@Data
@Builder
@NoArgsConstructor
public class MonthlyCustomerTrend {
    private String month;
    private Long newCustomers;

    @ConstructorProperties({"month", "newCustomers"})
    public MonthlyCustomerTrend(String month, Long newCustomers) {
        this.month = month;
        this.newCustomers = newCustomers;
    }
}
