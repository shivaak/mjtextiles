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
    private Boolean loyaltyEnabled;
    private BigDecimal pointsMinPurchaseAmount;
    private BigDecimal pointsPerHundred;
    private BigDecimal pointValue;
    private BigDecimal maxPointsRedemptionPercent;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ConstructorProperties({
        "id", "shopName", "address", "phone", "email", "gstNumber",
        "currency", "taxPercent", "invoicePrefix", "lastBillNumber",
        "lowStockThreshold", "loyaltyEnabled", "pointsMinPurchaseAmount",
        "pointsPerHundred", "pointValue", "maxPointsRedemptionPercent",
        "createdAt", "updatedAt"
    })
    public Settings(Integer id, String shopName, String address, String phone,
                    String email, String gstNumber, String currency, BigDecimal taxPercent,
                    String invoicePrefix, Integer lastBillNumber, Integer lowStockThreshold,
                    Boolean loyaltyEnabled, BigDecimal pointsMinPurchaseAmount,
                    BigDecimal pointsPerHundred, BigDecimal pointValue,
                    BigDecimal maxPointsRedemptionPercent,
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
        this.loyaltyEnabled = loyaltyEnabled;
        this.pointsMinPurchaseAmount = pointsMinPurchaseAmount;
        this.pointsPerHundred = pointsPerHundred;
        this.pointValue = pointValue;
        this.maxPointsRedemptionPercent = maxPointsRedemptionPercent;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
