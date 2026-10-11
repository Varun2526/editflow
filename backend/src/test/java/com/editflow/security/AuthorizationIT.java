package com.editflow.security;

import static com.editflow.support.TestData.PASSWORD;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** URL-level role rules: the first authorization layer. */
class AuthorizationIT extends IntegrationTest {

    private static final String ADMIN_PROBE = "/api/admin/_probe";
    private static final String CLIENT_PROBE = "/api/client/me/_probe";

    private String adminToken;
    private String clientAToken;
    private Client clientA;

    @BeforeEach
    void setUp() throws Exception {
        testData.admin("admin@editflow.test");
        clientA = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        testData.clientWithLogin("Urban Bites", "hello@urbanbites.test", false);
        adminToken = login("admin@editflow.test", PASSWORD);
        clientAToken = login("rahul@fitness.test", PASSWORD);
    }

    @Test
    void anonymousRequestsToProtectedRoutesAre401() throws Exception {
        for (String path : new String[] {ADMIN_PROBE, CLIENT_PROBE, "/api/auth/me", "/api/anything"}) {
            mvc.perform(get(path))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Test
    void publicRoutesDoNotRequireAuthentication() throws Exception {
        // No public endpoint exists yet, so the request reaches MVC and 404s rather than 401s.
        mvc.perform(get("/api/public/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resource not found"));
    }

    @Test
    void adminCanAccessAdminRoutes() throws Exception {
        mvc.perform(get(ADMIN_PROBE).header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    @Test
    void clientCannotAccessAdminRoutes() throws Exception {
        mvc.perform(get(ADMIN_PROBE).header("Authorization", bearer(clientAToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void adminCannotUseClientPortalRoutes() throws Exception {
        mvc.perform(get(CLIENT_PROBE).header("Authorization", bearer(adminToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void clientIdentityComesFromTheTokenNotTheRequest() throws Exception {
        // Even with a ?clientId= for someone else, the resolved client is the caller's own.
        mvc.perform(get(CLIENT_PROBE).param("clientId", "999").header("Authorization", bearer(clientAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value(clientA.getId()));
    }

    @Test
    void unmappedApiRoutesAreDeniedEvenWhenAuthenticated() throws Exception {
        mvc.perform(get("/api/anything").header("Authorization", bearer(adminToken)))
                .andExpect(status().isForbidden());
    }
}
