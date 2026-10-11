package com.editflow.common.exception;

import org.springframework.http.HttpStatus;

/** The request is valid but conflicts with current state (duplicate, illegal transition, already processed). */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
