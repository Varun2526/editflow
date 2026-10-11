package com.editflow.security;

import com.editflow.common.exception.TooManyRequestsException;
import com.editflow.common.ratelimit.RateLimitProperties;
import com.editflow.common.ratelimit.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Per-IP limits on the two unauthenticated write endpoints: login (brute force) and the public
 * inquiry form (spam). Everything else passes straight through.
 */
@Component
public class RequestRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN = "/api/auth/login";
    private static final String INQUIRIES = "/api/public/inquiries";

    private final boolean enabled;
    private final RateLimiter loginLimiter;
    private final RateLimiter inquiryLimiter;
    private final ApiErrorResponder errorResponder;

    public RequestRateLimitFilter(RateLimitProperties properties, Clock clock, ApiErrorResponder errorResponder) {
        this.enabled = properties.enabled();
        this.loginLimiter = new RateLimiter(properties.login(), clock);
        this.inquiryLimiter = new RateLimiter(properties.inquiries(), clock);
        this.errorResponder = errorResponder;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled || !"POST".equals(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !LOGIN.equals(path) && !INQUIRIES.equals(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        RateLimiter limiter = LOGIN.equals(request.getRequestURI()) ? loginLimiter : inquiryLimiter;
        long wait = limiter.consume(clientIp(request));
        if (wait > 0) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(wait));
            errorResponder.write(request, response, HttpStatus.TOO_MANY_REQUESTS, TooManyRequestsException.message(wait));
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * Behind Render's proxy the TCP peer is the proxy, so the original client comes from
     * X-Forwarded-For. A client can forge that header to get a fresh per-IP bucket, which is why
     * logins are also limited per account (see {@code LoginThrottle}).
     */
    static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
