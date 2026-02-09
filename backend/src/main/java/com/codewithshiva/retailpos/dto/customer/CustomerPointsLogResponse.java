package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.CustomerPointsLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Response DTO for customer points log entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPointsLogResponse {
    private Long id;
    private Long customerId;
    private Long saleId;
    private String type;
    private Integer points;
    private String description;
    private OffsetDateTime createdAt;

    /**
     * Create response from model.
     */
    public static CustomerPointsLogResponse fromPointsLog(CustomerPointsLog log) {
        return CustomerPointsLogResponse.builder()
                .id(log.getId())
                .customerId(log.getCustomerId())
                .saleId(log.getSaleId())
                .type(log.getType())
                .points(log.getPoints())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
