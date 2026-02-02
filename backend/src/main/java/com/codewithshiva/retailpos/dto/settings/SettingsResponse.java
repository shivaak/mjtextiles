package com.codewithshiva.retailpos.dto.settings;

import com.codewithshiva.retailpos.model.Settings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for shop settings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsResponse {
    private String shopName;
    private String address;
    private String phone;
    private String email;
    private String gstNumber;
    private String currency;
    private BigDecimal taxPercent;
    private String invoicePrefix;
    private Integer lowStockThreshold;
    private Integer lastBillNumber;

    /**
     * Create SettingsResponse from Settings entity.
     */
    public static SettingsResponse fromSettings(Settings settings) {
        return SettingsResponse.builder()
                .shopName(settings.getShopName())
                .address(settings.getAddress())
                .phone(settings.getPhone())
                .email(settings.getEmail())
                .gstNumber(settings.getGstNumber())
                .currency(settings.getCurrency())
                .taxPercent(settings.getTaxPercent())
                .invoicePrefix(settings.getInvoicePrefix())
                .lowStockThreshold(settings.getLowStockThreshold())
                .lastBillNumber(settings.getLastBillNumber())
                .build();
    }
}
