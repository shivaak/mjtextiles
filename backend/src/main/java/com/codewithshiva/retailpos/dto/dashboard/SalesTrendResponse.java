package com.codewithshiva.retailpos.dto.dashboard;

import com.codewithshiva.retailpos.model.DailySalesSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response DTO for daily sales trend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesTrendResponse {
    private LocalDate date;
    private BigDecimal sales;
    private BigDecimal profit;
    private Long transactions;

    public static SalesTrendResponse fromDailySalesSummary(DailySalesSummary summary) {
        return SalesTrendResponse.builder()
                .date(summary.getSaleDate())
                .sales(summary.getTotalSales() != null ? summary.getTotalSales() : BigDecimal.ZERO)
                .profit(summary.getTotalProfit() != null ? summary.getTotalProfit() : BigDecimal.ZERO)
                .transactions(summary.getTransactionCount() != null ? summary.getTransactionCount() : 0L)
                .build();
    }
}
