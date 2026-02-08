package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Product entity representing the products table.
 */
@Data
@Builder
@NoArgsConstructor
public class Product {
    private Long id;
    private String name;
    private String brand;
    private String category;
    private String hsn;
    private String description;
    private boolean isActive;
    private BigDecimal defaultDiscountPercent;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long createdBy;

    @ConstructorProperties({"id", "name", "brand", "category", "hsn", "description", "isActive",
                           "defaultDiscountPercent", "createdAt", "updatedAt", "createdBy"})
    public Product(Long id, String name, String brand, String category, String hsn, String description,
                   boolean isActive, BigDecimal defaultDiscountPercent, OffsetDateTime createdAt,
                   OffsetDateTime updatedAt, Long createdBy) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.hsn = hsn;
        this.description = description;
        this.isActive = isActive;
        this.defaultDiscountPercent = defaultDiscountPercent;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }
}
