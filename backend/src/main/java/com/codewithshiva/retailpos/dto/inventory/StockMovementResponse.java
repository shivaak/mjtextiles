package com.codewithshiva.retailpos.dto.inventory;

import com.codewithshiva.retailpos.model.StockMovement;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stock movement.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StockMovementResponse {
    private Long id;
    private String type;
    private OffsetDateTime date;
    private Integer qty;
    private Long referenceId;
    private String referenceNo;
    private String supplierName;
    private BigDecimal unitCost;
    private String notes;

    /**
     * Create StockMovementResponse from StockMovement model.
     */
    public static StockMovementResponse fromStockMovement(StockMovement movement) {
        return StockMovementResponse.builder()
                .id(movement.getId())
                .type(movement.getMovementType())
                .date(movement.getMovementDate())
                .qty(movement.getDeltaQty())
                .referenceId(movement.getReferenceId())
                .referenceNo(movement.getReferenceNo())
                .supplierName(movement.getSupplierName())
                .unitCost(movement.getUnitCost())
                .notes(movement.getNotes())
                .build();
    }
}
