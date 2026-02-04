package com.codewithshiva.retailpos.dto.purchase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for voiding a purchase.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoidPurchaseRequest {

    @NotBlank(message = "Void reason is required")
    @Size(max = 500, message = "Void reason must not exceed 500 characters")
    private String voidReason;
}
