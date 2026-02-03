package com.codewithshiva.retailpos.dto.dashboard;

import com.codewithshiva.retailpos.model.LowStockItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for low stock item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LowStockResponse {
    private Long variantId;
    private String productName;
    private String sku;
    private String size;
    private String color;
    private Integer stockQty;
    private Integer threshold;

    public static LowStockResponse fromLowStockItem(LowStockItem item) {
        return LowStockResponse.builder()
                .variantId(item.getVariantId())
                .productName(item.getProductName())
                .sku(item.getSku())
                .size(item.getSize())
                .color(item.getColor())
                .stockQty(item.getStockQty())
                .threshold(item.getThreshold())
                .build();
    }
}
