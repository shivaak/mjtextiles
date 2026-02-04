package com.codewithshiva.retailpos.dto.purchase;

import com.codewithshiva.retailpos.model.PurchaseItemWithVariant;
import com.codewithshiva.retailpos.model.PurchaseWithDetails;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for purchase detail view with items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseDetailResponse {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private String invoiceNo;
    private OffsetDateTime purchasedAt;
    private BigDecimal totalCost;
    private String notes;
    private String status;
    private OffsetDateTime voidedAt;
    private Long voidedBy;
    private String voidedByName;
    private String voidReason;
    private Long createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;
    private List<PurchaseItemResponse> items;

    /**
     * Create PurchaseDetailResponse from PurchaseWithDetails and items.
     */
    public static PurchaseDetailResponse fromPurchaseWithDetails(PurchaseWithDetails purchase, 
                                                                  List<PurchaseItemWithVariant> items) {
        List<PurchaseItemResponse> itemResponses = items.stream()
                .map(PurchaseItemResponse::fromPurchaseItemWithVariant)
                .collect(Collectors.toList());

        return PurchaseDetailResponse.builder()
                .id(purchase.getId())
                .supplierId(purchase.getSupplierId())
                .supplierName(purchase.getSupplierName())
                .invoiceNo(purchase.getInvoiceNo())
                .purchasedAt(purchase.getPurchasedAt())
                .totalCost(purchase.getTotalCost())
                .notes(purchase.getNotes())
                .status(purchase.getStatus())
                .voidedAt(purchase.getVoidedAt())
                .voidedBy(purchase.getVoidedBy())
                .voidedByName(purchase.getVoidedByName())
                .voidReason(purchase.getVoidReason())
                .createdBy(purchase.getCreatedBy())
                .createdByName(purchase.getCreatedByName())
                .createdAt(purchase.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
