package com.codewithshiva.retailpos.dto.report;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Sales Summary Report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalesSummaryReport {
    private Summary summary;
    private List<PeriodBreakdown> breakdown;
    private List<PaymentModeBreakdown> paymentModeBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private BigDecimal totalSales;
        private BigDecimal totalProfit;
        private Long totalTransactions;
        private BigDecimal avgOrderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodBreakdown {
        private String period;
        private BigDecimal sales;
        private BigDecimal profit;
        private Long transactions;
        private BigDecimal avgOrderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentModeBreakdown {
        private String mode;
        private BigDecimal amount;
        private Long count;
    }
}
