package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Variant entity representing the variants table.
 */
@Data
@Builder
@NoArgsConstructor
public class Variant {
    private Long id;
    private Long productId;
    private String sku;
    private String barcode;
    private String size;
    private String color;
    private BigDecimal sellingPrice;
    private BigDecimal avgCost;
    private Integer stockQty;
    private String status;
    private BigDecimal defaultDiscountPercent;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long createdBy;

    @ConstructorProperties({"id", "productId", "sku", "barcode", "size", "color", 
                           "sellingPrice", "avgCost", "stockQty", "status",
                           "defaultDiscountPercent", "createdAt", "updatedAt", "createdBy"})
    public Variant(Long id, Long productId, String sku, String barcode, String size, String color,
                   BigDecimal sellingPrice, BigDecimal avgCost, Integer stockQty, String status,
                   BigDecimal defaultDiscountPercent, OffsetDateTime createdAt, OffsetDateTime updatedAt,
                   Long createdBy) {
        this.id = id;
        this.productId = productId;
        this.sku = sku;
        this.barcode = barcode;
        this.size = size;
        this.color = color;
        this.sellingPrice = sellingPrice;
        this.avgCost = avgCost;
        this.stockQty = stockQty;
        this.status = status;
        this.defaultDiscountPercent = defaultDiscountPercent;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }
}
