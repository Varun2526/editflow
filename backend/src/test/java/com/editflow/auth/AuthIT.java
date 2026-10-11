package com.editflow.auth;

import static com.editflow.support.TestData.PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.common.config.AppProperties;
import com.editflow.security.JwtService;
import com.editflow.support.IntegrationTest;
import com.editflow.user.User;
import com.editflow.user.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.test.web.servlet.ResultActions;

class AuthIT extends IntegrationTest {

    private static final String ADMIN_EMAIL = "admin@editflow.test";

    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtEncoder jwtEncoder;

    @Autowired
    AppProperties appProperties;

    @Test
    void loginWithValidCredentialsReturnsBearerToken() throws Exception {
        testData.admin(ADMIN_EMAIL);

        postLogin(ADMIN_EMAIL, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void loginEmailIsCaseInsensitive() throws Exception {
        testData.admin(ADMIN_EMAIL);

        postLogin("Admin@EditFlow.TEST", PASSWORD).andExpect(status().isOk());
    }

    @Test
    void wrongPasswordAndUnknownEmailGiveTheSame401() throws Exception {
        testData.admin(ADMIN_EMAIL);

        postLogin(ADMIN_EMAIL, "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.path").value("/api/auth/login"));

        postLogin("nobody@editflow.test", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void loginValidatesRequestBody() throws Exception {
        postLogin("not-an-email", "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("email", "password")));
    }

    @Test
    void malformedJsonIs400() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed or unreadable request body"));
    }

    @Test
    void passwordsAreStoredAsBcryptHashes() {
        User admin = testData.admin(ADMIN_EMAIL);

        String hash = userRepository.findById(admin.getId()).orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$2").doesNotContain(PASSWORD);
    }

    @Test
    void meReturnsTheAuthenticatedUser() throws Exception {
        testData.admin(ADMIN_EMAIL);
        String token = login(ADMIN_EMAIL, PASSWORD);

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.mustChangePassword").value(false));
    }

    @Test
    void meWithoutTokenIs401() throws Exception {
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void tamperedTokenIs401() throws Exception {
        testData.admin(ADMIN_EMAIL);
        String token = login(ADMIN_EMAIL, PASSWORD);
        String tampered = token.substring(0, token.length() - 4) + "abcd";

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(tampered)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    @Test
    void expiredTokenIs401() throws Exception {
        User admin = testData.admin(ADMIN_EMAIL);
        Clock yesterday = Clock.fixed(Instant.now().minus(Duration.ofDays(1)), ZoneOffset.UTC);
        String expired = new JwtService(jwtEncoder, yesterday, appProperties).issue(admin).value();

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(expired)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    @Test
    void temporaryPasswordMustBeChangedBeforeUsingTheApi() throws Exception {
        String email = "rahul@fitness.test";
        testData.clientWithLogin("Rahul Fitness", email, true);
        String temporaryToken = login(email, PASSWORD);

        // Identity endpoints work, so the frontend can show the change-password screen...
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(temporaryToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));
        // ...but the portal itself is blocked by the backend, not just hidden.
        mvc.perform(get("/api/client/me/_probe").header("Authorization", bearer(temporaryToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You must change your password before continuing"));

        changePassword(temporaryToken, "wrong-current", "New-Password-1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
        changePassword(temporaryToken, PASSWORD, "short")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("newPassword"));

        String body = changePassword(temporaryToken, PASSWORD, "New-Password-1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.mustChangePassword").value(false))
                .andReturn().getResponse().getContentAsString();
        String freshToken = objectMapper.readTree(body).get("token").asText();

        mvc.perform(get("/api/client/me/_probe").header("Authorization", bearer(freshToken)))
                .andExpect(status().isOk());
        postLogin(email, PASSWORD).andExpect(status().isUnauthorized());
        postLogin(email, "New-Password-1").andExpect(status().isOk());
    }

    private ResultActions postLogin(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", password))));
    }

    private ResultActions changePassword(String token, String current, String next) throws Exception {
        return mvc.perform(post("/api/auth/change-password")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("currentPassword", current, "newPassword", next))));
    }
}
