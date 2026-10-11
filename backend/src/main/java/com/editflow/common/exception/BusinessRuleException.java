package com.editflow.common.exception;

import org.springframework.http.HttpStatus;

/** The request breaks a business rule (e.g. a payment that exceeds the remaining balance). */
public class BusinessRuleException extends ApiException {

    public BusinessRuleException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
