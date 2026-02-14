package com.codewithshiva.retailpos.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseValidationResult {
    private LicenseStatus status;
    private String message;
    private String installationId;
    private String machineHash;
    private Instant issuedAt;
    private Instant expiresAt;
    private Long daysRemaining;
    private Instant lastValidatedAtUtc;
    private Instant maxSeenTimeUtc;
}

