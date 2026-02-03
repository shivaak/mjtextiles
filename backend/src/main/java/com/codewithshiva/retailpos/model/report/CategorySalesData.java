package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for category sales aggregation.
 */
@Data
@Builder
@NoArgsConstructor
public class CategorySalesData {
    private String category;
    private Long qtySold;
    private BigDecimal revenue;
    private BigDecimal cost;
    private BigDecimal profit;

    @ConstructorProperties({"category", "qtySold", "revenue", "cost", "profit"})
    public CategorySalesData(String category, Long qtySold, BigDecimal revenue, 
                             BigDecimal cost, BigDecimal profit) {
        this.category = category;
        this.qtySold = qtySold;
        this.revenue = revenue;
        this.cost = cost;
        this.profit = profit;
    }
}
