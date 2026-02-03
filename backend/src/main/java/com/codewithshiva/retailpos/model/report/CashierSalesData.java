package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for cashier sales aggregation.
 */
@Data
@Builder
@NoArgsConstructor
public class CashierSalesData {
    private Long userId;
    private String userName;
    private BigDecimal revenue;
    private BigDecimal profit;
    private Long transactions;

    @ConstructorProperties({"userId", "userName", "revenue", "profit", "transactions"})
    public CashierSalesData(Long userId, String userName, BigDecimal revenue, 
                            BigDecimal profit, Long transactions) {
        this.userId = userId;
        this.userName = userName;
        this.revenue = revenue;
        this.profit = profit;
        this.transactions = transactions;
    }
}
