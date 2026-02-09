package com.codewithshiva.retailpos.dto.customer;

import com.codewithshiva.retailpos.model.Customer;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Response DTO for customer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerResponse {
    private Long id;
    private String phone;
    private String name;
    private Integer loyaltyPoints;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private Boolean isActive;
    private OffsetDateTime createdAt;

    /**
     * Create CustomerResponse from Customer entity.
     */
    public static CustomerResponse fromCustomer(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .phone(customer.getPhone())
                .name(customer.getName())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .totalPointsEarned(customer.getTotalPointsEarned())
                .totalPointsRedeemed(customer.getTotalPointsRedeemed())
                .isActive(customer.isActive())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
