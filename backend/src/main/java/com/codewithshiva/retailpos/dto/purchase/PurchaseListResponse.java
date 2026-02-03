package com.codewithshiva.retailpos.dto.purchase;

import com.codewithshiva.retailpos.model.PurchaseWithDetails;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for purchase list view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseListResponse {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private String invoiceNo;
    private OffsetDateTime purchasedAt;
    private BigDecimal totalCost;
    private Integer itemCount;
    private String notes;
    private Long createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;

    /**
     * Create PurchaseListResponse from PurchaseWithDetails model.
     */
    public static PurchaseListResponse fromPurchaseWithDetails(PurchaseWithDetails purchase) {
        return PurchaseListResponse.builder()
                .id(purchase.getId())
                .supplierId(purchase.getSupplierId())
                .supplierName(purchase.getSupplierName())
                .invoiceNo(purchase.getInvoiceNo())
                .purchasedAt(purchase.getPurchasedAt())
                .totalCost(purchase.getTotalCost())
                .itemCount(purchase.getItemCount())
                .notes(purchase.getNotes())
                .createdBy(purchase.getCreatedBy())
                .createdByName(purchase.getCreatedByName())
                .createdAt(purchase.getCreatedAt())
                .build();
    }
}
