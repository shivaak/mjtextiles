package com.codewithshiva.retailpos.dto.report;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Inventory Valuation Report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventoryValuationReport {
    private Summary summary;
    private List<CategoryValuation> byCategory;
    private List<BrandValuation> byBrand;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Integer totalSkus;
        private Long totalItems;
        private BigDecimal totalCostValue;
        private BigDecimal totalRetailValue;
        private BigDecimal potentialProfit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryValuation {
        private String category;
        private Integer skuCount;
        private Long itemCount;
        private BigDecimal costValue;
        private BigDecimal retailValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrandValuation {
        private String brand;
        private Integer skuCount;
        private Long itemCount;
        private BigDecimal costValue;
        private BigDecimal retailValue;
    }
}
