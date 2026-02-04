package com.codewithshiva.retailpos.dto.settings;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for updating shop settings.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSettingsRequest {

    @NotBlank(message = "Shop name is required")
    private String shopName;

    private String address;

    private String phone;

    private String email;

    private String gstNumber;

    private String currency;

    @DecimalMin(value = "0", message = "Tax percent must be at least 0")
    @DecimalMax(value = "100", message = "Tax percent must be at most 100")
    private BigDecimal taxPercent;

    private String invoicePrefix;

    @Min(value = 0, message = "Low stock threshold must be at least 0")
    private Integer lowStockThreshold;
}
