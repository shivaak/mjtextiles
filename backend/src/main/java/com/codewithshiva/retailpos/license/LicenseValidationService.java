package com.codewithshiva.retailpos.license;

import com.codewithshiva.retailpos.dao.LicenseDao;
import com.codewithshiva.retailpos.model.LicenseState;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LicenseValidationService {
    private final LicenseDao licenseDao;
    private final LicenseVerifier licenseVerifier;
    private final MachineFingerprintService machineFingerprintService;
    private final LicenseStoreService licenseStoreService;
    private final ObjectMapper objectMapper;

    @Value("${license.clock-rollback-tolerance-minutes:60}")
    private long rollbackToleranceMinutes;

    @Value("${license.expiry-grace-seconds:300}")
    private long expiryGraceSeconds;

    @Value("${license.machine-match-threshold:0.60}")
    private double machineMatchThreshold;

    @PostConstruct
    public void init() {
        licenseDao.initRow();
        ensureInstallationId();
    }

    @Transactional(readOnly = true)
    public MachineFingerprint getCurrentMachineFingerprint() {
        return machineFingerprintService.getCurrentFingerprint();
    }

    @Transactional
    public String getInstallationId() {
        return ensureInstallationId();
    }

    @Transactional
    public LicenseValidationResult activateLicense(String rawLicenseDocument) {
        SignedLicenseDocument document = parseDocument(rawLicenseDocument);
        String installationId = ensureInstallationId();
        MachineFingerprint currentFingerprint = machineFingerprintService.getCurrentFingerprint();

        if (!licenseVerifier.hasVerifierKeyConfigured()) {
            persistStatus(LicenseStatus.CONFIG_ERROR, "License verifier key is not configured", null);
            throw new IllegalStateException("License verifier key is not configured");
        }

        if (!licenseVerifier.verify(document)) {
            persistStatus(LicenseStatus.INVALID_SIGNATURE, "Signature validation failed", null);
            licenseDao.logAudit("ACTIVATE", LicenseStatus.INVALID_SIGNATURE.name(),
                    "License signature invalid", installationId, currentFingerprint.getMachineHash());
            throw new IllegalArgumentException("Invalid license signature");
        }

        LicensePayload payload = document.getPayload();
        validatePayloadBounds(payload);

        if (!installationId.equals(payload.getInstallationId())) {
            persistStatus(LicenseStatus.INSTALLATION_MISMATCH, "Installation ID mismatch", null);
            licenseDao.logAudit("ACTIVATE", LicenseStatus.INSTALLATION_MISMATCH.name(),
                    "License belongs to another installation", installationId, currentFingerprint.getMachineHash());
            throw new IllegalArgumentException("License belongs to another installation");
        }

        if (!matchesMachine(payload, currentFingerprint)) {
            persistStatus(LicenseStatus.MACHINE_MISMATCH, "Machine binding mismatch", null);
            licenseDao.logAudit("ACTIVATE", LicenseStatus.MACHINE_MISMATCH.name(),
                    "License machine binding mismatch", installationId, currentFingerprint.getMachineHash());
            throw new IllegalArgumentException("License is not valid for this machine");
        }

        Instant now = Instant.now();
        LicenseValidationResult result = evaluateDocument(
                installationId,
                currentFingerprint,
                document,
                now,
                null
        );

        licenseStoreService.saveRawLicense(rawLicenseDocument.trim());
        persistDocumentState(result.getStatus(), result.getMessage(), rawLicenseDocument.trim(), payload, now);
        licenseDao.logAudit("ACTIVATE", result.getStatus().name(),
                "License activated", installationId, currentFingerprint.getMachineHash());
        return result;
    }

    @Transactional
    public LicenseValidationResult validateCurrentLicense() {
        String installationId = ensureInstallationId();
        MachineFingerprint currentFingerprint = machineFingerprintService.getCurrentFingerprint();
        LicenseState state = licenseDao.getState().orElseThrow(() -> new IllegalStateException("License state not initialized"));

        if (!licenseVerifier.hasVerifierKeyConfigured()) {
            return persistAndBuildResult(
                    LicenseStatus.CONFIG_ERROR,
                    "License verifier key is not configured",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    null,
                    null,
                    state.getLastValidatedAtUtc(),
                    state.getMaxSeenTimeUtc()
            );
        }

        if (LicenseStatus.CLOCK_TAMPERED.name().equals(state.getStatus())) {
            return buildResult(
                    LicenseStatus.CLOCK_TAMPERED,
                    "System clock rollback detected. Contact administrator to reactivate license.",
                    installationId,
                    state.getMachineHash(),
                    toInstant(state.getIssuedAt()),
                    toInstant(state.getExpiresAt()),
                    state.getLastValidatedAtUtc(),
                    state.getMaxSeenTimeUtc()
            );
        }

        String rawDocument = state.getLicensePayload();
        if (rawDocument == null || rawDocument.isBlank()) {
            rawDocument = licenseStoreService.readRawLicense().orElse("");
        }

        if (rawDocument.isBlank()) {
            return persistAndBuildResult(
                    LicenseStatus.MISSING,
                    "License not installed",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    null,
                    null,
                    state.getLastValidatedAtUtc(),
                    state.getMaxSeenTimeUtc()
            );
        }

        SignedLicenseDocument document;
        try {
            document = parseDocument(rawDocument);
        } catch (Exception ex) {
            return persistAndBuildResult(
                    LicenseStatus.INVALID_FORMAT,
                    "License file format is invalid",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    null,
                    null,
                    state.getLastValidatedAtUtc(),
                    state.getMaxSeenTimeUtc()
            );
        }

        Instant now = Instant.now();
        LicenseValidationResult result = evaluateDocument(
                installationId,
                currentFingerprint,
                document,
                now,
                state
        );

        persistDocumentState(result.getStatus(), result.getMessage(), rawDocument, document.getPayload(), now);
        licenseDao.logAudit("VALIDATE", result.getStatus().name(), result.getMessage(),
                installationId, currentFingerprint.getMachineHash());
        return result;
    }

    @Transactional
    public LicenseValidationResult removeLicense() {
        String installationId = ensureInstallationId();
        MachineFingerprint currentFingerprint = machineFingerprintService.getCurrentFingerprint();
        licenseStoreService.deleteRawLicenseIfExists();
        licenseDao.clearLicense("License removed manually");
        licenseDao.logAudit(
                "REMOVE",
                LicenseStatus.MISSING.name(),
                "License removed manually",
                installationId,
                currentFingerprint.getMachineHash()
        );

        return LicenseValidationResult.builder()
                .status(LicenseStatus.MISSING)
                .message("License removed successfully")
                .installationId(installationId)
                .machineHash(currentFingerprint.getMachineHash())
                .build();
    }

    private LicenseValidationResult evaluateDocument(String installationId,
                                                     MachineFingerprint currentFingerprint,
                                                     SignedLicenseDocument document,
                                                     Instant now,
                                                     LicenseState state) {
        LicensePayload payload = document.getPayload();
        validatePayloadBounds(payload);

        if (!licenseVerifier.verify(document)) {
            return buildResult(
                    LicenseStatus.INVALID_SIGNATURE,
                    "License signature validation failed",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    payload.getIssuedAt(),
                    payload.getExpiresAt(),
                    toOffset(now),
                    maxSeen(now, state)
            );
        }

        if (!installationId.equals(payload.getInstallationId())) {
            return buildResult(
                    LicenseStatus.INSTALLATION_MISMATCH,
                    "License belongs to another installation",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    payload.getIssuedAt(),
                    payload.getExpiresAt(),
                    toOffset(now),
                    maxSeen(now, state)
            );
        }

        if (!matchesMachine(payload, currentFingerprint)) {
            return buildResult(
                    LicenseStatus.MACHINE_MISMATCH,
                    "License is not valid for this machine",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    payload.getIssuedAt(),
                    payload.getExpiresAt(),
                    toOffset(now),
                    maxSeen(now, state)
            );
        }

        OffsetDateTime maxSeen = maxSeen(now, state);
        if (state != null && state.getMaxSeenTimeUtc() != null) {
            Duration rollback = Duration.between(toOffset(now), state.getMaxSeenTimeUtc());
            if (rollback.toMinutes() > rollbackToleranceMinutes) {
                return buildResult(
                        LicenseStatus.CLOCK_TAMPERED,
                        "System clock rollback detected",
                        installationId,
                        currentFingerprint.getMachineHash(),
                        payload.getIssuedAt(),
                        payload.getExpiresAt(),
                        toOffset(now),
                        state.getMaxSeenTimeUtc()
                );
            }
        }

        Instant effectiveExpiry = payload.getExpiresAt().plusSeconds(expiryGraceSeconds);
        if (now.isAfter(effectiveExpiry)) {
            return buildResult(
                    LicenseStatus.EXPIRED,
                    "License has expired",
                    installationId,
                    currentFingerprint.getMachineHash(),
                    payload.getIssuedAt(),
                    payload.getExpiresAt(),
                    toOffset(now),
                    maxSeen
            );
        }

        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(now, payload.getExpiresAt()));
        return LicenseValidationResult.builder()
                .status(LicenseStatus.VALID)
                .message("License is valid")
                .installationId(installationId)
                .machineHash(currentFingerprint.getMachineHash())
                .issuedAt(payload.getIssuedAt())
                .expiresAt(payload.getExpiresAt())
                .daysRemaining(daysRemaining)
                .lastValidatedAtUtc(toOffset(now).toInstant())
                .maxSeenTimeUtc(maxSeen.toInstant())
                .build();
    }

    private boolean matchesMachine(LicensePayload payload, MachineFingerprint currentFingerprint) {
        Map<String, String> expectedFactors = payload.getMachineFactors();
        Map<String, String> currentFactors = currentFingerprint.getFactorHashes();

        if (expectedFactors != null && !expectedFactors.isEmpty()) {
            long matches = expectedFactors.entrySet().stream()
                    .filter(entry -> currentFactors.containsKey(entry.getKey()))
                    .filter(entry -> entry.getValue().equals(currentFactors.get(entry.getKey())))
                    .count();

            double ratio = (double) matches / (double) expectedFactors.size();
            return ratio >= machineMatchThreshold;
        }

        return payload.getMachineHash() != null
                && payload.getMachineHash().equals(currentFingerprint.getMachineHash());
    }

    private void validatePayloadBounds(LicensePayload payload) {
        if (payload == null
                || payload.getInstallationId() == null
                || payload.getMachineHash() == null
                || payload.getIssuedAt() == null
                || payload.getExpiresAt() == null) {
            throw new IllegalArgumentException("License payload is incomplete");
        }
        if (payload.getExpiresAt().isBefore(payload.getIssuedAt())) {
            throw new IllegalArgumentException("License expiry cannot be before issue date");
        }
    }

    private SignedLicenseDocument parseDocument(String rawLicenseDocument) {
        try {
            return objectMapper.readValue(rawLicenseDocument.trim(), SignedLicenseDocument.class);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid license document format", ex);
        }
    }

    private String ensureInstallationId() {
        licenseDao.initRow();
        LicenseState state = licenseDao.getState().orElseThrow(() -> new IllegalStateException("License state row missing"));
        if (state.getInstallationId() != null && !state.getInstallationId().isBlank()) {
            return state.getInstallationId();
        }

        String installationId = UUID.randomUUID().toString();
        licenseDao.updateInstallationId(installationId);
        return installationId;
    }

    private LicenseValidationResult persistAndBuildResult(LicenseStatus status,
                                                          String message,
                                                          String installationId,
                                                          String machineHash,
                                                          OffsetDateTime issuedAt,
                                                          OffsetDateTime expiresAt,
                                                          OffsetDateTime lastValidatedAtUtc,
                                                          OffsetDateTime maxSeenTimeUtc) {
        licenseDao.updateStatus(status.name(), message, lastValidatedAtUtc, maxSeenTimeUtc);
        return buildResult(status, message, installationId, machineHash, toInstant(issuedAt), toInstant(expiresAt),
                lastValidatedAtUtc, maxSeenTimeUtc);
    }

    private void persistStatus(LicenseStatus status, String reason, Instant now) {
        OffsetDateTime nowValue = now == null ? null : toOffset(now);
        licenseDao.updateStatus(status.name(), reason, nowValue, nowValue);
    }

    private void persistDocumentState(LicenseStatus status,
                                      String reason,
                                      String rawDocument,
                                      LicensePayload payload,
                                      Instant now) {
        LicenseState currentState = licenseDao.getState().orElseThrow(() -> new IllegalStateException("License state missing"));
        OffsetDateTime maxSeen = maxSeen(now, currentState);
        licenseDao.updateState(
                status.name(),
                reason,
                rawDocument,
                toOffset(payload.getIssuedAt()),
                toOffset(payload.getExpiresAt()),
                payload.getMachineHash(),
                toOffset(now),
                maxSeen
        );
    }

    private LicenseValidationResult buildResult(LicenseStatus status,
                                                String message,
                                                String installationId,
                                                String machineHash,
                                                Instant issuedAt,
                                                Instant expiresAt,
                                                OffsetDateTime lastValidatedAtUtc,
                                                OffsetDateTime maxSeenTimeUtc) {
        Long daysRemaining = expiresAt == null ? null : Math.max(0, ChronoUnit.DAYS.between(Instant.now(), expiresAt));
        return LicenseValidationResult.builder()
                .status(status)
                .message(message)
                .installationId(installationId)
                .machineHash(machineHash)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .daysRemaining(daysRemaining)
                .lastValidatedAtUtc(toInstant(lastValidatedAtUtc))
                .maxSeenTimeUtc(toInstant(maxSeenTimeUtc))
                .build();
    }

    private OffsetDateTime maxSeen(Instant now, LicenseState state) {
        OffsetDateTime nowValue = toOffset(now);
        if (state == null || state.getMaxSeenTimeUtc() == null) {
            return nowValue;
        }
        return state.getMaxSeenTimeUtc().isAfter(nowValue) ? state.getMaxSeenTimeUtc() : nowValue;
    }

    private OffsetDateTime toOffset(Instant instant) {
        return instant == null ? null : OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    private Instant toInstant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }
}

