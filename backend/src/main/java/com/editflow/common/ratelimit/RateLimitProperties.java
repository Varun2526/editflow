package com.editflow.common.ratelimit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Abuse protection for the public endpoints, bound from {@code app.rate-limit.*}.
 *
 * @param login          login attempts per client IP
 * @param loginFailures  failed logins per account (not spoofable by changing IP)
 * @param inquiries      Work With Me submissions per client IP
 */
@Validated
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        @DefaultValue("true") boolean enabled,
        @Valid Rule login,
        @Valid Rule loginFailures,
        @Valid Rule inquiries) {

    public RateLimitProperties {
        login = login != null ? login : new Rule(10, Duration.ofMinutes(5));
        loginFailures = loginFailures != null ? loginFailures : new Rule(20, Duration.ofMinutes(15));
        inquiries = inquiries != null ? inquiries : new Rule(5, Duration.ofHours(1));
    }

    public record Rule(@Positive int limit, @NotNull Duration window) {
    }
}
