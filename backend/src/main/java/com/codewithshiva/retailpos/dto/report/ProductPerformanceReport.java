package com.codewithshiva.retailpos.dto.report;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Product Performance Report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductPerformanceReport {
    private List<TopSeller> topSellers;
    private List<SlowMover> slowMovers;
    private List<CategoryBreakdown> categoryBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSeller {
        private Long variantId;
        private String productName;
        private String sku;
        private String category;
        private String brand;
        private Long qtySold;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;
        private BigDecimal markupPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlowMover {
        private Long variantId;
        private String productName;
        private String sku;
        private Long qtySold;
        private Integer daysSinceLastSale;
        private Integer stockQty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private String category;
        private Long qtySold;
        private BigDecimal revenue;
        private BigDecimal profit;
    }
}
