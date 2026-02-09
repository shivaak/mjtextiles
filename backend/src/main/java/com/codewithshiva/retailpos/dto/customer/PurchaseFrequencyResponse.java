package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.PurchaseFrequency;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for purchase frequency distribution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseFrequencyResponse {
    private String bucket;
    private Long customerCount;

    public static PurchaseFrequencyResponse fromPurchaseFrequency(PurchaseFrequency freq) {
        return PurchaseFrequencyResponse.builder()
                .bucket(freq.getBucket())
                .customerCount(freq.getCustomerCount())
                .build();
    }
}
