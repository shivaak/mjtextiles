package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for dashboard statistics.
 */
@Data
@Builder
@NoArgsConstructor
public class DashboardStats {
    private BigDecimal totalSales;
    private BigDecimal totalProfit;
    private Long totalTransactions;
    private BigDecimal avgOrderValue;
    private Integer lowStockCount;
    private Integer outOfStockCount;
    private Integer totalSkus;

    @ConstructorProperties({"totalSales", "totalProfit", "totalTransactions", "avgOrderValue",
                           "lowStockCount", "outOfStockCount", "totalSkus"})
    public DashboardStats(BigDecimal totalSales, BigDecimal totalProfit, Long totalTransactions,
                          BigDecimal avgOrderValue, Integer lowStockCount, Integer outOfStockCount,
                          Integer totalSkus) {
        this.totalSales = totalSales;
        this.totalProfit = totalProfit;
        this.totalTransactions = totalTransactions;
        this.avgOrderValue = avgOrderValue;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
        this.totalSkus = totalSkus;
    }
}
