package com.codewithshiva.retailpos.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
public class LicenseState {
    private Integer id;
    private String installationId;
    private String status;
    private String statusReason;
    private String licensePayload;
    private OffsetDateTime issuedAt;
    private OffsetDateTime expiresAt;
    private String machineHash;
    private OffsetDateTime lastValidatedAtUtc;
    private OffsetDateTime maxSeenTimeUtc;
    private OffsetDateTime updatedAt;
    private OffsetDateTime createdAt;

    @ConstructorProperties({
            "id", "installationId", "status", "statusReason", "licensePayload",
            "issuedAt", "expiresAt", "machineHash", "lastValidatedAtUtc", "maxSeenTimeUtc",
            "updatedAt", "createdAt"
    })
    public LicenseState(Integer id, String installationId, String status, String statusReason,
                        String licensePayload, OffsetDateTime issuedAt, OffsetDateTime expiresAt,
                        String machineHash, OffsetDateTime lastValidatedAtUtc, OffsetDateTime maxSeenTimeUtc,
                        OffsetDateTime updatedAt, OffsetDateTime createdAt) {
        this.id = id;
        this.installationId = installationId;
        this.status = status;
        this.statusReason = statusReason;
        this.licensePayload = licensePayload;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
        this.machineHash = machineHash;
        this.lastValidatedAtUtc = lastValidatedAtUtc;
        this.maxSeenTimeUtc = maxSeenTimeUtc;
        this.updatedAt = updatedAt;
        this.createdAt = createdAt;
    }
}

