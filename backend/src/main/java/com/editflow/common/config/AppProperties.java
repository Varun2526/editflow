package com.editflow.common.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.ZoneId;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Application settings bound from {@code app.*}. Validated at startup so a misconfigured
 * deployment fails fast instead of serving requests with broken CORS, dates or tokens.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotNull ZoneId timezone,
        @Valid @NotNull Cors cors,
        @Valid @NotNull Jwt jwt,
        @NotNull Admin admin) {

    public record Cors(@NotEmpty List<String> allowedOrigins) {
    }

    /**
     * @param allowGeneratedSecret only true in the local profile: lets the app start without
     *                             JWT_SECRET by generating a random per-process key.
     */
    public record Jwt(String secret, @Positive long ttlMinutes, boolean allowGeneratedSecret) {
    }

    public record Admin(String email, String password, String name) {
    }
}
