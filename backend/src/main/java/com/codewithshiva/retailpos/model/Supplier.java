package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * Supplier entity representing the suppliers table.
 */
@Data
@Builder
@NoArgsConstructor
public class Supplier {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long createdBy;

    @ConstructorProperties({"id", "name", "phone", "email", "address", "gstNumber", 
                           "isActive", "createdAt", "updatedAt", "createdBy"})
    public Supplier(Long id, String name, String phone, String email, String address,
                    String gstNumber, boolean isActive, OffsetDateTime createdAt, 
                    OffsetDateTime updatedAt, Long createdBy) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.gstNumber = gstNumber;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }
}
