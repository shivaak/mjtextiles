package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

/**
 * ShortCode entity representing the short_codes table.
 */
@Data
@Builder
@NoArgsConstructor
public class ShortCode {
    private Long id;
    private String type;
    private String name;
    private String shortCode;
    private OffsetDateTime createdAt;

    @ConstructorProperties({"id", "type", "name", "shortCode", "createdAt"})
    public ShortCode(Long id, String type, String name, String shortCode, OffsetDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.shortCode = shortCode;
        this.createdAt = createdAt;
    }
}
