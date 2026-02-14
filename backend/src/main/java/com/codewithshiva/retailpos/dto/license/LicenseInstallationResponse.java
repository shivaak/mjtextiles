package com.codewithshiva.retailpos.dto.license;

import com.codewithshiva.retailpos.license.MachineFingerprint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseInstallationResponse {
    private String installationId;
    private String machineHash;
    private Map<String, String> machineFactors;

    public static LicenseInstallationResponse of(String installationId, MachineFingerprint fingerprint) {
        return LicenseInstallationResponse.builder()
                .installationId(installationId)
                .machineHash(fingerprint.getMachineHash())
                .machineFactors(fingerprint.getFactorHashes())
                .build();
    }
}

