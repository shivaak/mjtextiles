package com.codewithshiva.retailpos.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Unsiged payload that gets cryptographically signed by the license issuer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicensePayload {
    private String customerName;
    private String installationId;
    private String machineHash;
    private Map<String, String> machineFactors;
    private Instant issuedAt;
    private Instant expiresAt;
    private Map<String, String> features;
    private String nonce;
}

