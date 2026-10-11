package com.editflow.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    private Instant now = Instant.parse("2026-10-11T05:00:00Z");
    private final Clock clock = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    };
    private final RateLimiter limiter = new RateLimiter(new RateLimitProperties.Rule(3, Duration.ofMinutes(5)), clock);

    @Test
    void allowsUpToTheLimitThenReportsTheWait() {
        assertThat(limiter.consume("1.2.3.4")).isZero();
        assertThat(limiter.consume("1.2.3.4")).isZero();
        assertThat(limiter.consume("1.2.3.4")).isZero();
        assertThat(limiter.consume("1.2.3.4")).isEqualTo(300);

        now = now.plusSeconds(120);
        assertThat(limiter.consume("1.2.3.4")).isEqualTo(180);
    }

    @Test
    void keysAreIndependentAndTheWindowResets() {
        for (int i = 0; i < 4; i++) limiter.consume("a");
        assertThat(limiter.consume("b")).isZero();

        now = now.plus(Duration.ofMinutes(5));
        assertThat(limiter.consume("a")).isZero();
    }

    @Test
    void blockedForDoesNotCountAndResetClears() {
        assertThat(limiter.blockedFor("x")).isZero();
        for (int i = 0; i < 3; i++) limiter.consume("x");
        assertThat(limiter.blockedFor("x")).isEqualTo(300);
        assertThat(limiter.blockedFor("x")).isEqualTo(300);

        limiter.reset("x");
        assertThat(limiter.blockedFor("x")).isZero();
    }
}
