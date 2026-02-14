package com.codewithshiva.retailpos.exception;

/**
 * Custom exception for authentication failures.
 */
public class AuthenticationException extends RuntimeException {

    private final String code;

    public AuthenticationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    // Common authentication error codes
    public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    public static final String ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
    public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
    public static final String INVALID_TOKEN = "INVALID_TOKEN";
    public static final String SESSION_EXPIRED = "SESSION_EXPIRED";
    public static final String LICENSE_MISSING = "LICENSE_MISSING";
    public static final String LICENSE_EXPIRED = "LICENSE_EXPIRED";
    public static final String LICENSE_INVALID = "LICENSE_INVALID";
    public static final String LICENSE_MACHINE_MISMATCH = "LICENSE_MACHINE_MISMATCH";
    public static final String LICENSE_INSTALLATION_MISMATCH = "LICENSE_INSTALLATION_MISMATCH";
    public static final String LICENSE_CLOCK_TAMPERED = "LICENSE_CLOCK_TAMPERED";
}
