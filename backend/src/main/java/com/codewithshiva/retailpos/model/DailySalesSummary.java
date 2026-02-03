package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Model representing daily sales summary from v_daily_sales_summary view.
 */
@Data
@Builder
@NoArgsConstructor
public class DailySalesSummary {
    private LocalDate saleDate;
    private Long transactionCount;
    private BigDecimal totalSales;
    private BigDecimal totalProfit;
    private Long voidedCount;
    private Long cashCount;
    private Long cardCount;
    private Long upiCount;
    private Long creditCount;

    @ConstructorProperties({"saleDate", "transactionCount", "totalSales", "totalProfit",
                           "voidedCount", "cashCount", "cardCount", "upiCount", "creditCount"})
    public DailySalesSummary(LocalDate saleDate, Long transactionCount, BigDecimal totalSales,
                             BigDecimal totalProfit, Long voidedCount, Long cashCount,
                             Long cardCount, Long upiCount, Long creditCount) {
        this.saleDate = saleDate;
        this.transactionCount = transactionCount;
        this.totalSales = totalSales;
        this.totalProfit = totalProfit;
        this.voidedCount = voidedCount;
        this.cashCount = cashCount;
        this.cardCount = cardCount;
        this.upiCount = upiCount;
        this.creditCount = creditCount;
    }
}
