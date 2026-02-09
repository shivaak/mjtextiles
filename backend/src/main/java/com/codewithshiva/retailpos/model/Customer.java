package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * Customer entity representing the customers table.
 */
@Data
@Builder
@NoArgsConstructor
public class Customer {
    private Long id;
    private String phone;
    private String name;
    private String area;
    private Integer loyaltyPoints;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({"id", "phone", "name", "area", "loyaltyPoints", "totalPointsEarned",
                           "totalPointsRedeemed", "createdAt", "updatedAt"})
    public Customer(Long id, String phone, String name, String area, Integer loyaltyPoints,
                    Integer totalPointsEarned, Integer totalPointsRedeemed,
                    OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.phone = phone;
        this.name = name;
        this.area = area;
        this.loyaltyPoints = loyaltyPoints;
        this.totalPointsEarned = totalPointsEarned;
        this.totalPointsRedeemed = totalPointsRedeemed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
