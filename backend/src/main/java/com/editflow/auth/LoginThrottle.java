package com.editflow.auth;

import com.editflow.common.exception.TooManyRequestsException;
import com.editflow.common.ratelimit.RateLimitProperties;
import com.editflow.common.ratelimit.RateLimiter;
import java.time.Clock;
import org.springframework.stereotype.Component;

/** Limits failed logins per account, independent of the caller's IP. A successful login clears it. */
@Component
public class LoginThrottle {

    private final boolean enabled;
    private final RateLimiter failures;

    public LoginThrottle(RateLimitProperties properties, Clock clock) {
        this.enabled = properties.enabled();
        this.failures = new RateLimiter(properties.loginFailures(), clock);
    }

    public void checkAllowed(String email) {
        long wait = enabled ? failures.blockedFor(email) : 0;
        if (wait > 0) {
            throw new TooManyRequestsException(wait);
        }
    }

    public void recordFailure(String email) {
        if (enabled) {
            failures.consume(email);
        }
    }

    public void recordSuccess(String email) {
        failures.reset(email);
    }
}
