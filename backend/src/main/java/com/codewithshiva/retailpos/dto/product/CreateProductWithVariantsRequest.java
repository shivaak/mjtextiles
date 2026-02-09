package com.codewithshiva.retailpos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating a product with variants in one go.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductWithVariantsRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    @NotBlank(message = "Brand is required")
    @Size(max = 100, message = "Brand must not exceed 100 characters")
    private String brand;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    @NotBlank(message = "HSN is required")
    @Size(max = 20, message = "HSN must not exceed 20 characters")
    private String hsn;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @DecimalMin(value = "0.00", message = "Discount must be at least 0%")
    @DecimalMax(value = "100.00", message = "Discount must not exceed 100%")
    private BigDecimal defaultDiscountPercent;

    @Valid
    private List<VariantItem> variants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantItem {
        @NotBlank(message = "SKU is required")
        @Size(max = 50, message = "SKU must not exceed 50 characters")
        private String sku;

        @Size(max = 50, message = "Barcode must not exceed 50 characters")
        private String barcode;

        @Size(max = 20, message = "Size must not exceed 20 characters")
        private String size;

        @Size(max = 50, message = "Color must not exceed 50 characters")
        private String color;

        @Size(max = 50, message = "Fabric must not exceed 50 characters")
        private String fabric;

        @NotNull(message = "Selling price is required")
        @DecimalMin(value = "0.00", message = "Selling price must be non-negative")
        private BigDecimal sellingPrice;

        @DecimalMin(value = "0.00", message = "Average cost must be non-negative")
        private BigDecimal avgCost;

        @DecimalMin(value = "0.00", message = "Discount must be at least 0%")
        @DecimalMax(value = "100.00", message = "Discount must not exceed 100%")
        private BigDecimal defaultDiscountPercent;

        @Min(value = 0, message = "Initial stock must be non-negative")
        private Integer initialStock;
    }
}
