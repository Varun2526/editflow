package com.editflow.security;

import static com.editflow.support.TestData.PASSWORD;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.support.IntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;

/** Abuse protection on the public endpoints, with tiny limits so the tests stay fast. */
@TestPropertySource(properties = {
        "app.rate-limit.enabled=true",
        "app.rate-limit.login.limit=3",
        "app.rate-limit.login.window=1m",
        "app.rate-limit.login-failures.limit=2",
        "app.rate-limit.login-failures.window=15m",
        "app.rate-limit.inquiries.limit=2",
        "app.rate-limit.inquiries.window=1h"})
class RateLimitIT extends IntegrationTest {

    @Test
    void loginAttemptsAreLimitedPerClientIp() throws Exception {
        testData.admin("admin@editflow.test");
        for (int i = 0; i < 3; i++) {
            login("10.0.0.1", "admin@editflow.test", PASSWORD).andExpect(status().isOk());
        }
        login("10.0.0.1", "admin@editflow.test", PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Too many attempts. Please try again in 1 minute."));

        // Another client is unaffected.
        login("10.0.0.2", "admin@editflow.test", PASSWORD).andExpect(status().isOk());
    }

    @Test
    void repeatedWrongPasswordsLockTheAccountEvenAcrossIps() throws Exception {
        testData.admin("owner@editflow.test");
        login("10.1.0.1", "owner@editflow.test", "wrong-password-1").andExpect(status().isUnauthorized());
        login("10.1.0.2", "owner@editflow.test", "wrong-password-2").andExpect(status().isUnauthorized());

        // Even the right password waits until the window passes, so guessing can't continue.
        login("10.1.0.3", "owner@editflow.test", PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.message").value("Too many attempts. Please try again in 15 minutes."));
    }

    @Test
    void successfulLoginClearsEarlierFailures() throws Exception {
        testData.admin("editor@editflow.test");
        login("10.2.0.1", "editor@editflow.test", "wrong-password").andExpect(status().isUnauthorized());
        login("10.2.0.1", "editor@editflow.test", PASSWORD).andExpect(status().isOk());
        login("10.2.0.2", "editor@editflow.test", "wrong-password").andExpect(status().isUnauthorized());
        login("10.2.0.2", "editor@editflow.test", PASSWORD).andExpect(status().isOk());
    }

    @Test
    void inquirySubmissionsAreLimitedPerClientIp() throws Exception {
        inquiry("10.3.0.1", "a@creator.test").andExpect(status().isCreated());
        inquiry("10.3.0.1", "b@creator.test").andExpect(status().isCreated());
        inquiry("10.3.0.1", "c@creator.test")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.path").value("/api/public/inquiries"));
        inquiry("10.3.0.9", "d@creator.test").andExpect(status().isCreated());
    }

    private ResultActions login(String ip, String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .header("X-Forwarded-For", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", password))));
    }

    private ResultActions inquiry(String ip, String email) throws Exception {
        return mvc.perform(post("/api/public/inquiries")
                .header("X-Forwarded-For", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("name", "Priya Talks", "email", email, "phoneOrInstagram", "@priyatalks",
                        "contentType", "Podcasts", "videosPerMonth", 4, "budget", 12000))));
    }
}
