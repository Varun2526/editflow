package com.editflow.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/** The single error body returned for every 4xx/5xx response. */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        boolean success,
        int status,
        String message,
        String path,
        Instant timestamp,
        List<FieldViolation> errors) {

    public record FieldViolation(String field, String message) {
    }

    public static ApiError of(int status, String message, String path) {
        return new ApiError(false, status, message, path, Instant.now(), List.of());
    }

    public static ApiError of(int status, String message, String path, List<FieldViolation> errors) {
        return new ApiError(false, status, message, path, Instant.now(), errors);
    }
}
