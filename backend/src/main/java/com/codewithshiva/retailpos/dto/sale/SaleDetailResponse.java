package com.codewithshiva.retailpos.dto.sale;

import com.codewithshiva.retailpos.dto.Views;
import com.codewithshiva.retailpos.model.SaleItemWithVariant;
import com.codewithshiva.retailpos.model.SaleWithDetails;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
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
    @JsonView(Views.Employee.class)
    private Long id;
    @JsonView(Views.Employee.class)
    private String billNo;
    @JsonView(Views.Employee.class)
    private OffsetDateTime soldAt;
    @JsonView(Views.Employee.class)
    private String customerName;
    @JsonView(Views.Employee.class)
    private String customerPhone;
    @JsonView(Views.Employee.class)
    private String paymentMode;
    @JsonView(Views.Employee.class)
    private BigDecimal subtotal;
    @JsonView(Views.Employee.class)
    private BigDecimal discountPercent;
    @JsonView(Views.Employee.class)
    private BigDecimal discountAmount;
    @JsonView(Views.Employee.class)
    private BigDecimal taxPercent;
    @JsonView(Views.Employee.class)
    private BigDecimal taxAmount;
    @JsonView(Views.Employee.class)
    private BigDecimal total;
    @JsonView(Views.Admin.class) // Only visible to ADMIN
    private BigDecimal profit;
    @JsonView(Views.Employee.class)
    private String status;
    @JsonView(Views.Employee.class)
    private Long createdBy;
    @JsonView(Views.Employee.class)
    private String createdByName;
    @JsonView(Views.Employee.class)
    private OffsetDateTime createdAt;
    @JsonView(Views.Employee.class)
    private OffsetDateTime voidedAt;
    @JsonView(Views.Employee.class)
    private Long voidedBy;
    @JsonView(Views.Employee.class)
    private String voidedByName;
    @JsonView(Views.Employee.class)
    private String voidReason;
    @JsonView(Views.Employee.class)
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
