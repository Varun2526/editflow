package com.editflow.common.ratelimit;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory fixed-window counter per key. Enough for a single instance; counters reset on restart,
 * which is acceptable for abuse protection (no Redis needed).
 */
public class RateLimiter {

    private static final int CLEANUP_THRESHOLD = 10_000;

    private final RateLimitProperties.Rule rule;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimiter(RateLimitProperties.Rule rule, Clock clock) {
        this.rule = rule;
        this.clock = clock;
    }

    /** Counts one event; returns 0 if allowed, otherwise the seconds until the key may try again. */
    public long consume(String key) {
        long now = clock.millis();
        cleanupIfLarge(now);
        Window window = windows.compute(key, (k, w) -> w == null || w.expired(now, rule.window())
                ? new Window(now, 1)
                : new Window(w.start, w.count + 1));
        return window.count > rule.limit() ? window.secondsLeft(now, rule.window()) : 0;
    }

    /** Seconds until the key is allowed again, without counting anything (0 = allowed). */
    public long blockedFor(String key) {
        long now = clock.millis();
        Window window = windows.get(key);
        if (window == null || window.expired(now, rule.window()) || window.count < rule.limit()) {
            return 0;
        }
        return window.secondsLeft(now, rule.window());
    }

    public void reset(String key) {
        windows.remove(key);
    }

    private void cleanupIfLarge(long now) {
        if (windows.size() > CLEANUP_THRESHOLD) {
            windows.values().removeIf(w -> w.expired(now, rule.window()));
        }
    }

    private record Window(long start, int count) {

        boolean expired(long now, Duration length) {
            return now - start >= length.toMillis();
        }

        long secondsLeft(long now, Duration length) {
            return Math.max(1, (start + length.toMillis() - now + 999) / 1000);
        }
    }
}
