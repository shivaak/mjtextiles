package com.codewithshiva.retailpos.exception;

/**
 * Custom exception for bad request scenarios.
 */
public class BadRequestException extends RuntimeException {

    private final String code;

    public BadRequestException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BadRequestException(String message) {
        super(message);
        this.code = "BAD_REQUEST";
    }

    public String getCode() {
        return code;
    }
}
