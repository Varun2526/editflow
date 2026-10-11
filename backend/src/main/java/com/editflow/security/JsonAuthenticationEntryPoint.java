package com.editflow.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/** 401: no token, or a token that is malformed, tampered with or expired. */
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ApiErrorResponder responder;

    public JsonAuthenticationEntryPoint(ApiErrorResponder responder) {
        this.responder = responder;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        String message = ex instanceof InvalidBearerTokenException
                ? "Invalid or expired token"
                : "Authentication required";
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        responder.write(request, response, HttpStatus.UNAUTHORIZED, message);
    }
}
