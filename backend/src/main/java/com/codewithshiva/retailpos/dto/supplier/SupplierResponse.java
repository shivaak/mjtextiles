package com.codewithshiva.retailpos.dto.supplier;

import com.codewithshiva.retailpos.model.Supplier;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Response DTO for supplier.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupplierResponse {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private Boolean isActive;
    private OffsetDateTime createdAt;

    /**
     * Create SupplierResponse from Supplier entity.
     */
    public static SupplierResponse fromSupplier(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .address(supplier.getAddress())
                .gstNumber(supplier.getGstNumber())
                .isActive(supplier.isActive())
                .createdAt(supplier.getCreatedAt())
                .build();
    }
}
