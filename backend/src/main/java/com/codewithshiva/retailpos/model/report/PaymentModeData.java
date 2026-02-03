package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for payment mode aggregation.
 */
@Data
@Builder
@NoArgsConstructor
public class PaymentModeData {
    private String mode;
    private BigDecimal amount;
    private Long count;

    @ConstructorProperties({"mode", "amount", "count"})
    public PaymentModeData(String mode, BigDecimal amount, Long count) {
        this.mode = mode;
        this.amount = amount;
        this.count = count;
    }
}
