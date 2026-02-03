package com.codewithshiva.retailpos.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating a new sale.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleRequest {

    @Size(max = 100, message = "Customer name must not exceed 100 characters")
    private String customerName;

    @Size(max = 20, message = "Customer phone must not exceed 20 characters")
    private String customerPhone;

    @NotNull(message = "Payment mode is required")
    @Pattern(regexp = "^(CASH|CARD|UPI|CREDIT)$", message = "Payment mode must be CASH, CARD, UPI, or CREDIT")
    private String paymentMode;

    @DecimalMin(value = "0.00", message = "Discount percent must be non-negative")
    @DecimalMax(value = "100.00", message = "Discount percent cannot exceed 100")
    private BigDecimal discountPercent;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<CreateSaleItemRequest> items;
}
