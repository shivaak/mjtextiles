package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * Model representing a customer points log entry.
 */
@Data
@Builder
@NoArgsConstructor
public class CustomerPointsLog {
    private Long id;
    private Long customerId;
    private Long saleId;
    private String type;
    private Integer points;
    private String description;
    private Long createdBy;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "customerId", "saleId", "type", "points",
                           "description", "createdBy", "createdAt"})
    public CustomerPointsLog(Long id, Long customerId, Long saleId, String type,
                             Integer points, String description, Long createdBy,
                             OffsetDateTime createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.saleId = saleId;
        this.type = type;
        this.points = points;
        this.description = description;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
