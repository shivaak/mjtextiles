package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
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
    private String description;
    private boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long createdBy;

    @ConstructorProperties({"id", "name", "brand", "category", "description", "isActive", 
                           "createdAt", "updatedAt", "createdBy"})
    public Product(Long id, String name, String brand, String category, String description,
                   boolean isActive, OffsetDateTime createdAt, OffsetDateTime updatedAt, Long createdBy) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }
}
