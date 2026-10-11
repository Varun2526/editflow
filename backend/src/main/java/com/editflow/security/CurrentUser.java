package com.editflow.security;

import com.editflow.client.ClientRepository;
import com.editflow.common.exception.AuthenticationFailedException;
import com.editflow.common.exception.ForbiddenException;
import com.editflow.user.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Identity of the caller, taken only from the verified JWT. Ownership checks must use
 * {@link #clientId()} rather than any client id supplied in a request.
 */
@Component
public class CurrentUser {

    private final ClientRepository clientRepository;

    public CurrentUser(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Long userId() {
        return Long.valueOf(token().getSubject());
    }

    public Role role() {
        return Role.valueOf(token().getClaimAsString(JwtService.ROLE_CLAIM));
    }

    /** The client profile linked to the authenticated CLIENT account. */
    public Long clientId() {
        return clientRepository.findIdByUserId(userId())
                .orElseThrow(() -> new ForbiddenException("No client profile is linked to this account"));
    }

    private Jwt token() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            return jwtAuthentication.getToken();
        }
        throw new AuthenticationFailedException("Authentication required");
    }
}
