package com.editflow.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base for expected business failures. The message is safe to show to API clients;
 * anything else that escapes becomes a generic 500.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
