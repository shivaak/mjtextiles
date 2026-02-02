package com.codewithshiva.retailpos.exception;

/**
 * Custom exception for conflict scenarios (HTTP 409).
 * Used when a resource already exists or conflicts with current state.
 */
public class ConflictException extends RuntimeException {

    private final String code;

    public ConflictException(String code, String message) {
        super(message);
        this.code = code;
    }

    public ConflictException(String message) {
        super(message);
        this.code = "CONFLICT";
    }

    public String getCode() {
        return code;
    }
}
