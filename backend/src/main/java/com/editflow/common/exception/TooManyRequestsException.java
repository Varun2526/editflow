package com.editflow.common.exception;

import org.springframework.http.HttpStatus;

/** A rate limit was hit. Carries how long the caller should wait (sent as {@code Retry-After}). */
public class TooManyRequestsException extends ApiException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(long retryAfterSeconds) {
        super(HttpStatus.TOO_MANY_REQUESTS, message(retryAfterSeconds));
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public static String message(long retryAfterSeconds) {
        long minutes = Math.max(1, (retryAfterSeconds + 59) / 60);
        return "Too many attempts. Please try again in " + minutes + (minutes == 1 ? " minute." : " minutes.");
    }
}
