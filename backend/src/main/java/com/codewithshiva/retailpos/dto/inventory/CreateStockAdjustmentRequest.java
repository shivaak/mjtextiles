package com.codewithshiva.retailpos.dto.inventory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a stock adjustment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStockAdjustmentRequest {

    @NotNull(message = "Variant ID is required")
    private Long variantId;

    @NotNull(message = "Delta quantity is required")
    private Integer deltaQty;

    @NotNull(message = "Reason is required")
    @Pattern(regexp = "^(OPENING_STOCK|DAMAGE|THEFT|CORRECTION|RETURN|OTHER)$", 
             message = "Reason must be one of: OPENING_STOCK, DAMAGE, THEFT, CORRECTION, RETURN, OTHER")
    private String reason;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
