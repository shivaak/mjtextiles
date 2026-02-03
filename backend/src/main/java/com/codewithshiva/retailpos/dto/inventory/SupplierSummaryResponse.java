package com.codewithshiva.retailpos.dto.inventory;

import com.codewithshiva.retailpos.model.SupplierSummary;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for supplier summary for a variant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupplierSummaryResponse {
    private Long supplierId;
    private String supplierName;
    private Long totalQty;
    private Long purchaseCount;
    private OffsetDateTime lastPurchaseDate;
    private BigDecimal avgUnitCost;

    /**
     * Create SupplierSummaryResponse from SupplierSummary model.
     */
    public static SupplierSummaryResponse fromSupplierSummary(SupplierSummary summary) {
        return SupplierSummaryResponse.builder()
                .supplierId(summary.getSupplierId())
                .supplierName(summary.getSupplierName())
                .totalQty(summary.getTotalQty())
                .purchaseCount(summary.getPurchaseCount())
                .lastPurchaseDate(summary.getLastPurchaseDate())
                .avgUnitCost(summary.getAvgUnitCost())
                .build();
    }
}
