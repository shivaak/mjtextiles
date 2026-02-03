package com.codewithshiva.retailpos.dto.sale;

import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.codewithshiva.retailpos.model.SaleWithDetails;
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
 * Response DTO for sale detail view with items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaleDetailResponse {
    private Long id;
    private String billNo;
    private OffsetDateTime soldAt;
    private String customerName;
    private String customerPhone;
    private String paymentMode;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private BigDecimal profit;
    private String status;
    private Long createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime voidedAt;
    private Long voidedBy;
    private String voidedByName;
    private String voidReason;
    private List<SaleItemResponse> items;

    /**
     * Create SaleDetailResponse from SaleWithDetails and items.
     */
    public static SaleDetailResponse fromSaleWithDetails(SaleWithDetails sale, List<SaleItemWithVariant> items) {
        List<SaleItemResponse> itemResponses = items.stream()
                .map(SaleItemResponse::fromSaleItemWithVariant)
                .collect(Collectors.toList());

        return SaleDetailResponse.builder()
                .id(sale.getId())
                .billNo(sale.getBillNo())
                .soldAt(sale.getSoldAt())
                .customerName(sale.getCustomerName())
                .customerPhone(sale.getCustomerPhone())
                .paymentMode(sale.getPaymentMode())
                .subtotal(sale.getSubtotal())
                .discountPercent(sale.getDiscountPercent())
                .discountAmount(sale.getDiscountAmount())
                .taxPercent(sale.getTaxPercent())
                .taxAmount(sale.getTaxAmount())
                .total(sale.getTotal())
                .profit(sale.getProfit())
                .status(sale.getStatus())
                .createdBy(sale.getCreatedBy())
                .createdByName(sale.getCreatedByName())
                .createdAt(sale.getCreatedAt())
                .voidedAt(sale.getVoidedAt())
                .voidedBy(sale.getVoidedBy())
                .voidedByName(sale.getVoidedByName())
                .voidReason(sale.getVoidReason())
                .items(itemResponses)
                .build();
    }
}
