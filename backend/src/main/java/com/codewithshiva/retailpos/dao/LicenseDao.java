package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.LicenseState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.OffsetDateTime;
import java.util.Optional;

@RegisterConstructorMapper(LicenseState.class)
public interface LicenseDao {

    @SqlUpdate("""
        INSERT INTO app_license_state (id, status)
        VALUES (1, 'MISSING')
        ON CONFLICT (id) DO NOTHING
        """)
    void initRow();

    @SqlQuery("""
        SELECT id,
               installation_id as installationId,
               status,
               status_reason as statusReason,
               license_payload::text as licensePayload,
               issued_at as issuedAt,
               expires_at as expiresAt,
               machine_hash as machineHash,
               last_validated_at_utc as lastValidatedAtUtc,
               max_seen_time_utc as maxSeenTimeUtc,
               updated_at as updatedAt,
               created_at as createdAt
        FROM app_license_state
        WHERE id = 1
        """)
    Optional<LicenseState> getState();

    @SqlUpdate("""
        UPDATE app_license_state
        SET installation_id = :installationId,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """)
    void updateInstallationId(@Bind("installationId") String installationId);

    @SqlUpdate("""
        UPDATE app_license_state
        SET status = :status,
            status_reason = :statusReason,
            license_payload = CAST(:licensePayload AS jsonb),
            issued_at = :issuedAt,
            expires_at = :expiresAt,
            machine_hash = :machineHash,
            last_validated_at_utc = :lastValidatedAtUtc,
            max_seen_time_utc = :maxSeenTimeUtc,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """)
    void updateState(@Bind("status") String status,
                     @Bind("statusReason") String statusReason,
                     @Bind("licensePayload") String licensePayload,
                     @Bind("issuedAt") OffsetDateTime issuedAt,
                     @Bind("expiresAt") OffsetDateTime expiresAt,
                     @Bind("machineHash") String machineHash,
                     @Bind("lastValidatedAtUtc") OffsetDateTime lastValidatedAtUtc,
                     @Bind("maxSeenTimeUtc") OffsetDateTime maxSeenTimeUtc);

    @SqlUpdate("""
        UPDATE app_license_state
        SET status = :status,
            status_reason = :statusReason,
            last_validated_at_utc = :lastValidatedAtUtc,
            max_seen_time_utc = :maxSeenTimeUtc,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """)
    void updateStatus(@Bind("status") String status,
                      @Bind("statusReason") String statusReason,
                      @Bind("lastValidatedAtUtc") OffsetDateTime lastValidatedAtUtc,
                      @Bind("maxSeenTimeUtc") OffsetDateTime maxSeenTimeUtc);

    @SqlUpdate("""
        UPDATE app_license_state
        SET status = 'MISSING',
            status_reason = :statusReason,
            license_payload = NULL,
            issued_at = NULL,
            expires_at = NULL,
            machine_hash = NULL,
            last_validated_at_utc = NULL,
            max_seen_time_utc = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """)
    void clearLicense(@Bind("statusReason") String statusReason);

    @SqlUpdate("""
        INSERT INTO license_audit_log (action, status, message, installation_id, machine_hash)
        VALUES (:action, :status, :message, :installationId, :machineHash)
        """)
    void logAudit(@Bind("action") String action,
                  @Bind("status") String status,
                  @Bind("message") String message,
                  @Bind("installationId") String installationId,
                  @Bind("machineHash") String machineHash);
}

