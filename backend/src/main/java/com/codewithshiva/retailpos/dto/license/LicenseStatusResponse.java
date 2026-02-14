package com.codewithshiva.retailpos.dto.license;

import com.codewithshiva.retailpos.license.LicenseValidationResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseStatusResponse {
    private String status;
    private String message;
    private String installationId;
    private String machineHash;
    private Instant issuedAt;
    private Instant expiresAt;
    private Long daysRemaining;
    private Instant lastValidatedAtUtc;
    private Instant maxSeenTimeUtc;

    public static LicenseStatusResponse from(LicenseValidationResult result) {
        return LicenseStatusResponse.builder()
                .status(result.getStatus().name())
                .message(result.getMessage())
                .installationId(result.getInstallationId())
                .machineHash(result.getMachineHash())
                .issuedAt(result.getIssuedAt())
                .expiresAt(result.getExpiresAt())
                .daysRemaining(result.getDaysRemaining())
                .lastValidatedAtUtc(result.getLastValidatedAtUtc())
                .maxSeenTimeUtc(result.getMaxSeenTimeUtc())
                .build();
    }
}

