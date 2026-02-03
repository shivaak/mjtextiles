package com.codewithshiva.retailpos.dto.sale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for voiding a sale.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoidSaleRequest {

    @NotBlank(message = "Void reason is required")
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
