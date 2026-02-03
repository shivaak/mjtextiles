package com.codewithshiva.retailpos.dto.inventory;

import com.codewithshiva.retailpos.model.StockAdjustment;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Response DTO for stock adjustment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StockAdjustmentResponse {
    private Long id;
    private Long variantId;
    private Integer deltaQty;
    private String reason;
    private String notes;
    private Long createdBy;
    private OffsetDateTime createdAt;

    /**
     * Create StockAdjustmentResponse from StockAdjustment model.
     */
    public static StockAdjustmentResponse fromStockAdjustment(StockAdjustment adjustment) {
        return StockAdjustmentResponse.builder()
                .id(adjustment.getId())
                .variantId(adjustment.getVariantId())
                .deltaQty(adjustment.getDeltaQty())
                .reason(adjustment.getReason())
                .notes(adjustment.getNotes())
                .createdBy(adjustment.getCreatedBy())
                .createdAt(adjustment.getCreatedAt())
                .build();
    }
}
