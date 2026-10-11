package com.editflow.common.exception;

import org.springframework.http.HttpStatus;

/** Authenticated, but the resource belongs to someone else. */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
