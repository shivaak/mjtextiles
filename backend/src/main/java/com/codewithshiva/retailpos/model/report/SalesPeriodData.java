package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for sales data grouped by period.
 */
@Data
@Builder
@NoArgsConstructor
public class SalesPeriodData {
    private String period;
    private BigDecimal sales;
    private BigDecimal profit;
    private Long transactions;

    @ConstructorProperties({"period", "sales", "profit", "transactions"})
    public SalesPeriodData(String period, BigDecimal sales, BigDecimal profit, Long transactions) {
        this.period = period;
        this.sales = sales;
        this.profit = profit;
        this.transactions = transactions;
    }
}
