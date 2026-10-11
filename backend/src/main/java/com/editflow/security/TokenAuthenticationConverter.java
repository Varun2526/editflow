package com.editflow.security;

import java.util.ArrayList;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/** Maps our token claims to authorities: role -> ROLE_ADMIN / ROLE_CLIENT, pwd_change -> PASSWORD_CHANGE_REQUIRED. */
@Component
public class TokenAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        String role = jwt.getClaimAsString(JwtService.ROLE_CLAIM);
        if (role != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        if (Boolean.TRUE.equals(jwt.getClaimAsBoolean(JwtService.PASSWORD_CHANGE_CLAIM))) {
            authorities.add(new SimpleGrantedAuthority(SecurityAuthorities.PASSWORD_CHANGE_REQUIRED));
        }
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }
}
