package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;

/**
 * Model for customer purchase frequency distribution.
 */
@Data
@Builder
@NoArgsConstructor
public class PurchaseFrequency {
    private String bucket;
    private Long customerCount;
    private Integer sortOrder;

    @ConstructorProperties({"bucket", "customerCount", "sortOrder"})
    public PurchaseFrequency(String bucket, Long customerCount, Integer sortOrder) {
        this.bucket = bucket;
        this.customerCount = customerCount;
        this.sortOrder = sortOrder;
    }
}
