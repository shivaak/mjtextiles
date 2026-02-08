package com.codewithshiva.retailpos.dto.variant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for updating an existing variant.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVariantRequest {

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @Size(max = 50, message = "Barcode must not exceed 50 characters")
    private String barcode;

    @Size(max = 20, message = "Size must not exceed 20 characters")
    private String size;

    @Size(max = 50, message = "Color must not exceed 50 characters")
    private String color;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.00", message = "Selling price must be non-negative")
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0.00", message = "Average cost must be non-negative")
    private BigDecimal avgCost;

    @DecimalMin(value = "0.00", message = "Discount must be at least 0%")
    @DecimalMax(value = "100.00", message = "Discount must not exceed 100%")
    private BigDecimal defaultDiscountPercent;
}
