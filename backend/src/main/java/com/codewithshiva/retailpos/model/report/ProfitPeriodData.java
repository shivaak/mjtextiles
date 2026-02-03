package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for profit data grouped by period.
 */
@Data
@Builder
@NoArgsConstructor
public class ProfitPeriodData {
    private String period;
    private BigDecimal revenue;
    private BigDecimal cost;
    private BigDecimal profit;

    @ConstructorProperties({"period", "revenue", "cost", "profit"})
    public ProfitPeriodData(String period, BigDecimal revenue, BigDecimal cost, BigDecimal profit) {
        this.period = period;
        this.revenue = revenue;
        this.cost = cost;
        this.profit = profit;
    }
}
