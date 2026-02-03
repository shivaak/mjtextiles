package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Model representing variant with product information.
 * Maps to the v_variants_with_products view.
 */
@Data
@Builder
@NoArgsConstructor
public class VariantWithProduct {
    private Long id;
    private Long productId;
    private String productName;
    private String productBrand;
    private String productCategory;
    private String sku;
    private String barcode;
    private String size;
    private String color;
    private BigDecimal sellingPrice;
    private BigDecimal avgCost;
    private Integer stockQty;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({"id", "productId", "productName", "productBrand", "productCategory",
                           "sku", "barcode", "size", "color", "sellingPrice", "avgCost", 
                           "stockQty", "status", "createdAt", "updatedAt"})
    public VariantWithProduct(Long id, Long productId, String productName, String productBrand, 
                              String productCategory, String sku, String barcode, String size, 
                              String color, BigDecimal sellingPrice, BigDecimal avgCost, 
                              Integer stockQty, String status, OffsetDateTime createdAt, 
                              OffsetDateTime updatedAt) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productBrand = productBrand;
        this.productCategory = productCategory;
        this.sku = sku;
        this.barcode = barcode;
        this.size = size;
        this.color = color;
        this.sellingPrice = sellingPrice;
        this.avgCost = avgCost;
        this.stockQty = stockQty;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
