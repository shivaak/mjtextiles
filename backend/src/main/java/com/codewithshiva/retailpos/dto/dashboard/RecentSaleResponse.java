package com.codewithshiva.retailpos.dto.dashboard;

import com.codewithshiva.retailpos.model.RecentSale;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for recent sale.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecentSaleResponse {
    private Long id;
    private String billNo;
    private OffsetDateTime soldAt;
    private String customerName;
    private BigDecimal total;
    private Integer itemCount;
    private String paymentMode;
    private String status;

    public static RecentSaleResponse fromRecentSale(RecentSale sale) {
        return RecentSaleResponse.builder()
                .id(sale.getId())
                .billNo(sale.getBillNo())
                .soldAt(sale.getSoldAt())
                .customerName(sale.getCustomerName())
                .total(sale.getTotal())
                .itemCount(sale.getItemCount())
                .paymentMode(sale.getPaymentMode())
                .status(sale.getStatus())
                .build();
    }
}
