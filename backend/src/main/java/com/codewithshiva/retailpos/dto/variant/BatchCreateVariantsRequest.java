package com.codewithshiva.retailpos.dto.variant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for batch creating variants for an existing product.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateVariantsRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotEmpty(message = "At least one variant is required")
    @Valid
    private List<VariantItem> variants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantItem {
        @jakarta.validation.constraints.NotBlank(message = "SKU is required")
        @jakarta.validation.constraints.Size(max = 50, message = "SKU must not exceed 50 characters")
        private String sku;

        @jakarta.validation.constraints.Size(max = 50, message = "Barcode must not exceed 50 characters")
        private String barcode;

        @jakarta.validation.constraints.Size(max = 20, message = "Size must not exceed 20 characters")
        private String size;

        @jakarta.validation.constraints.Size(max = 50, message = "Color must not exceed 50 characters")
        private String color;

        @jakarta.validation.constraints.Size(max = 50, message = "Fabric must not exceed 50 characters")
        private String fabric;

        @jakarta.validation.constraints.NotNull(message = "Selling price is required")
        @jakarta.validation.constraints.DecimalMin(value = "0.00", message = "Selling price must be non-negative")
        private java.math.BigDecimal sellingPrice;

        @jakarta.validation.constraints.DecimalMin(value = "0.00", message = "Average cost must be non-negative")
        private java.math.BigDecimal avgCost;

        @jakarta.validation.constraints.DecimalMin(value = "0.00", message = "Discount must be at least 0%")
        @jakarta.validation.constraints.DecimalMax(value = "100.00", message = "Discount must not exceed 100%")
        private java.math.BigDecimal defaultDiscountPercent;

        @jakarta.validation.constraints.Min(value = 0, message = "Initial stock must be non-negative")
        private Integer initialStock;
    }
}
