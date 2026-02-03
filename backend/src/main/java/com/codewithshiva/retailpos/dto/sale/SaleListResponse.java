package com.codewithshiva.retailpos.dto.sale;

import com.codewithshiva.retailpos.model.SaleWithDetails;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for sale list view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaleListResponse {
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
    private Integer itemCount;
    private String status;
    private Long createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;

    /**
     * Create SaleListResponse from SaleWithDetails model.
     */
    public static SaleListResponse fromSaleWithDetails(SaleWithDetails sale) {
        return SaleListResponse.builder()
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
                .itemCount(sale.getItemCount())
                .status(sale.getStatus())
                .createdBy(sale.getCreatedBy())
                .createdByName(sale.getCreatedByName())
                .createdAt(sale.getCreatedAt())
                .build();
    }
}
