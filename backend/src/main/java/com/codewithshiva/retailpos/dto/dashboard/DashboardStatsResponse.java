package com.codewithshiva.retailpos.dto.dashboard;

import com.codewithshiva.retailpos.model.DashboardStats;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for dashboard statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private BigDecimal totalSales;
    private BigDecimal totalProfit;
    private Long totalTransactions;
    private BigDecimal avgOrderValue;
    private Integer lowStockCount;
    private Integer outOfStockCount;
    private Integer totalSkus;

    public static DashboardStatsResponse fromDashboardStats(DashboardStats stats) {
        return DashboardStatsResponse.builder()
                .totalSales(stats.getTotalSales() != null ? stats.getTotalSales() : BigDecimal.ZERO)
                .totalProfit(stats.getTotalProfit() != null ? stats.getTotalProfit() : BigDecimal.ZERO)
                .totalTransactions(stats.getTotalTransactions() != null ? stats.getTotalTransactions() : 0L)
                .avgOrderValue(stats.getAvgOrderValue() != null ? stats.getAvgOrderValue() : BigDecimal.ZERO)
                .lowStockCount(stats.getLowStockCount() != null ? stats.getLowStockCount() : 0)
                .outOfStockCount(stats.getOutOfStockCount() != null ? stats.getOutOfStockCount() : 0)
                .totalSkus(stats.getTotalSkus() != null ? stats.getTotalSkus() : 0)
                .build();
    }
}
