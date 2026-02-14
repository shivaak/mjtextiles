package com.codewithshiva.retailpos.license;

/**
 * Canonical license states used by backend and frontend.
 */
public enum LicenseStatus {
    VALID,
    MISSING,
    EXPIRED,
    INVALID_FORMAT,
    INVALID_SIGNATURE,
    MACHINE_MISMATCH,
    INSTALLATION_MISMATCH,
    CLOCK_TAMPERED,
    CONFIG_ERROR
}

