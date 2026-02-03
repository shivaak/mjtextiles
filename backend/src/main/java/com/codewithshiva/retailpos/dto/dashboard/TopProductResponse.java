package com.codewithshiva.retailpos.dto.dashboard;

import com.codewithshiva.retailpos.model.TopSellingProduct;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for top selling product.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TopProductResponse {
    private Long variantId;
    private String productName;
    private String sku;
    private String size;
    private String color;
    private Long qtySold;
    private BigDecimal revenue;
    private BigDecimal profit;

    public static TopProductResponse fromTopSellingProduct(TopSellingProduct product) {
        return TopProductResponse.builder()
                .variantId(product.getVariantId())
                .productName(product.getProductName())
                .sku(product.getSku())
                .size(product.getSize())
                .color(product.getColor())
                .qtySold(product.getQtySold())
                .revenue(product.getRevenue() != null ? product.getRevenue() : BigDecimal.ZERO)
                .profit(product.getProfit() != null ? product.getProfit() : BigDecimal.ZERO)
                .build();
    }
}
