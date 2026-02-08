package com.codewithshiva.retailpos.dto.sale;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for a sale item in create sale request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleItemRequest {

    @NotNull(message = "Variant ID is required")
    private Long variantId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer qty;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Item discount must be at least 0%")
    @DecimalMax(value = "100.00", message = "Item discount must not exceed 100%")
    private BigDecimal itemDiscountPercent;
}
