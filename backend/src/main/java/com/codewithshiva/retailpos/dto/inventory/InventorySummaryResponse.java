package com.codewithshiva.retailpos.dto.inventory;

import com.codewithshiva.retailpos.model.InventorySummary;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for inventory summary.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventorySummaryResponse {
    private Long totalSkus;
    private Long totalItems;
    private BigDecimal totalValue;
    private Long lowStockCount;
    private Long outOfStockCount;

    /**
     * Create InventorySummaryResponse from InventorySummary model.
     */
    public static InventorySummaryResponse fromInventorySummary(InventorySummary summary) {
        return InventorySummaryResponse.builder()
                .totalSkus(summary.getTotalSkus())
                .totalItems(summary.getTotalItems())
                .totalValue(summary.getTotalCostValue()) // Using cost value as totalValue
                .lowStockCount(summary.getLowStockCount())
                .outOfStockCount(summary.getOutOfStockCount())
                .build();
    }
}
