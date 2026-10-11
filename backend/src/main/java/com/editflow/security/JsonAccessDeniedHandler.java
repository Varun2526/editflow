package com.editflow.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/** 403: authenticated, but the role doesn't allow the route (or a password change is pending). */
@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private final ApiErrorResponder responder;

    public JsonAccessDeniedHandler(ApiErrorResponder responder) {
        this.responder = responder;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        String message = passwordChangePending()
                ? "You must change your password before continuing"
                : "Access denied";
        responder.write(request, response, HttpStatus.FORBIDDEN, message);
    }

    private static boolean passwordChangePending() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> SecurityAuthorities.PASSWORD_CHANGE_REQUIRED.equals(a.getAuthority()));
    }
}
