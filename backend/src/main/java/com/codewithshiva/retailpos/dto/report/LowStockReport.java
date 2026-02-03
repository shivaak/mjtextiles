package com.codewithshiva.retailpos.dto.report;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Low Stock Report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LowStockReport {
    private Summary summary;
    private List<LowStockItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Integer lowStockCount;
        private Integer outOfStockCount;
        private BigDecimal totalReorderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockItem {
        private Long variantId;
        private String productName;
        private String sku;
        private String category;
        private String brand;
        private Integer currentStock;
        private Integer threshold;
        private BigDecimal avgMonthlySales;
        private Integer suggestedReorder;
        private BigDecimal lastPurchasePrice;
        private BigDecimal reorderCost;
        private String lastSupplier;
    }
}
