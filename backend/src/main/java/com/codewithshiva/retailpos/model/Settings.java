package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Settings entity representing the settings table.
 * This is a single-row table (id = 1) for shop configuration.
 */
@Data
@Builder
@NoArgsConstructor
public class Settings {
    private Integer id;
    private String shopName;
    private String address;
    private String phone;
    private String email;
    private String gstNumber;
    private String currency;
    private BigDecimal taxPercent;
    private String invoicePrefix;
    private Integer lastBillNumber;
    private Integer lowStockThreshold;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({
        "id", "shopName", "address", "phone", "email", "gstNumber",
        "currency", "taxPercent", "invoicePrefix", "lastBillNumber",
        "lowStockThreshold", "createdAt", "updatedAt"
    })
    public Settings(Integer id, String shopName, String address, String phone,
                    String email, String gstNumber, String currency, BigDecimal taxPercent,
                    String invoicePrefix, Integer lastBillNumber, Integer lowStockThreshold,
                    OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.shopName = shopName;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.gstNumber = gstNumber;
        this.currency = currency;
        this.taxPercent = taxPercent;
        this.invoicePrefix = invoicePrefix;
        this.lastBillNumber = lastBillNumber;
        this.lowStockThreshold = lowStockThreshold;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
