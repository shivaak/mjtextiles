package com.codewithshiva.retailpos.dto.product;

import com.codewithshiva.retailpos.model.Product;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for product (list view).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductResponse {
    private Long id;
    private String name;
    private String brand;
    private String category;
    private String hsn;
    private String description;
    private Integer variantCount;
    private Boolean isActive;
    private BigDecimal defaultDiscountPercent;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    /**
     * Create ProductResponse from Product entity.
     */
    public static ProductResponse fromProduct(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(product.getCategory())
                .hsn(product.getHsn())
                .description(product.getDescription())
                .isActive(product.isActive())
                .defaultDiscountPercent(product.getDefaultDiscountPercent())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    /**
     * Create ProductResponse from Product entity with variant count.
     */
    public static ProductResponse fromProduct(Product product, int variantCount) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(product.getCategory())
                .hsn(product.getHsn())
                .description(product.getDescription())
                .variantCount(variantCount)
                .isActive(product.isActive())
                .defaultDiscountPercent(product.getDefaultDiscountPercent())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
