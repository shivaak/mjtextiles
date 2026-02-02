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
}
