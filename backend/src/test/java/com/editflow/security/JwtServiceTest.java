package com.editflow.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.editflow.common.config.AppProperties;
import com.editflow.user.Role;
import com.editflow.user.User;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-11T06:00:00Z");
    private static final SecretKey KEY = key("unit-test-signing-secret-at-least-32-bytes");

    private final JwtService jwtService = new JwtService(
            new NimbusJwtEncoder(new ImmutableSecret<>(KEY)),
            Clock.fixed(NOW, ZoneOffset.UTC),
            new AppProperties(ZoneId.of("Asia/Kolkata"), new AppProperties.Cors(List.of("http://localhost:5173")),
                    new AppProperties.Jwt(null, 480, false), new AppProperties.Admin(null, null, null)));

    @Test
    void tokenCarriesSubjectRoleIssuerAndExpiry() {
        JwtService.IssuedToken token = jwtService.issue(user(42L, Role.CLIENT, false));

        Jwt jwt = decoderFor(KEY).decode(token.value());
        assertThat(jwt.getSubject()).isEqualTo("42");
        assertThat(jwt.getClaimAsString(JwtService.ROLE_CLAIM)).isEqualTo("CLIENT");
        assertThat(jwt.getClaimAsString("iss")).isEqualTo(JwtService.ISSUER);
        assertThat(jwt.getExpiresAt()).isEqualTo(NOW.plusSeconds(480 * 60));
        assertThat(token.expiresAt()).isEqualTo(jwt.getExpiresAt());
        assertThat(jwt.hasClaim(JwtService.PASSWORD_CHANGE_CLAIM)).isFalse();
    }

    @Test
    void temporaryPasswordAccountsGetThePasswordChangeClaim() {
        Jwt jwt = decoderFor(KEY).decode(jwtService.issue(user(7L, Role.CLIENT, true)).value());

        assertThat(jwt.getClaimAsBoolean(JwtService.PASSWORD_CHANGE_CLAIM)).isTrue();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = jwtService.issue(user(1L, Role.ADMIN, false)).value();
        NimbusJwtDecoder otherDecoder = decoderFor(key("a-completely-different-secret-of-32-bytes!"));

        assertThatThrownBy(() -> otherDecoder.decode(token)).isInstanceOf(JwtException.class);
    }

    private static NimbusJwtDecoder decoderFor(SecretKey key) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        // Skip expiry validation here: NOW is a fixed instant, not the wall clock.
        decoder.setJwtValidator(jwt -> org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success());
        return decoder;
    }

    private static SecretKey key(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private static User user(Long id, Role role, boolean mustChangePassword) {
        User user = new User("Test", "test@editflow.test", "hash", role, mustChangePassword);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
