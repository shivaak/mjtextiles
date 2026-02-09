package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Offer entity representing the offers table.
 */
@Data
@Builder
@NoArgsConstructor
public class Offer {
    private Long id;
    private String name;
    private String offerType;
    private boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal comboPrice;
    private Integer buyQty;
    private Integer freeQty;
    private Integer priority;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({"id", "name", "offerType", "isActive", "startDate", "endDate",
                           "comboPrice", "buyQty", "freeQty", "priority", "createdBy", "createdAt", "updatedAt"})
    public Offer(Long id, String name, String offerType, boolean isActive, LocalDate startDate,
                 LocalDate endDate, BigDecimal comboPrice, Integer buyQty, Integer freeQty,
                 Integer priority, Long createdBy,
                 OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.offerType = offerType;
        this.isActive = isActive;
        this.startDate = startDate;
        this.endDate = endDate;
        this.comboPrice = comboPrice;
        this.buyQty = buyQty;
        this.freeQty = freeQty;
        this.priority = priority;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
