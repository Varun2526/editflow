package com.editflow.client;

import static com.editflow.support.TestData.PASSWORD;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.project.Project;
import com.editflow.project.ProjectStatus;
import com.editflow.support.IntegrationTest;
import com.editflow.video.VideoStatus;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ClientIT extends IntegrationTest {

    private String admin;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
    }

    @Test
    void adminCreatesClientWithoutPortalAccess() throws Exception {
        mvc.perform(post("/api/admin/clients").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(clientBody("Rahul@Fitness.test", false))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/admin/clients/")))
                .andExpect(jsonPath("$.client.email").value("rahul@fitness.test"))
                .andExpect(jsonPath("$.client.hasPortalAccess").value(false))
                .andExpect(jsonPath("$.client.notes").value("Prefers fast cuts"))
                .andExpect(jsonPath("$.portalAccess").doesNotExist());
    }

    @Test
    void adminCreatesClientWithPortalAccess() throws Exception {
        String response = mvc.perform(post("/api/admin/clients").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(clientBody("rahul@fitness.test", true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.client.hasPortalAccess").value(true))
                .andReturn().getResponse().getContentAsString();
        String temporaryPassword = objectMapper.readTree(response).at("/portalAccess/temporaryPassword").asText();

        login("rahul@fitness.test", temporaryPassword);
    }

    @Test
    void duplicateClientEmailIs409() throws Exception {
        testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");

        mvc.perform(post("/api/admin/clients").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(clientBody("RAHUL@fitness.test", false))))
                .andExpect(status().isConflict());
    }

    @Test
    void listShowsCurrentProjectWithDerivedVideoAndPaymentFigures() throws Exception {
        Client client = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        testData.project(client, 11, 2026, "30000", ProjectStatus.ARCHIVED);
        Project active = testData.project(client, 10, 2026, "25000");
        testData.video(active, "Morning Workout Reel", VideoStatus.DELIVERED, LocalDate.now());
        testData.video(active, "Nutrition Tips", VideoStatus.EDITING, LocalDate.now());
        testData.payment(active, "10000", LocalDate.of(2026, 10, 1));

        mvc.perform(get("/api/admin/clients").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rahul Fitness"))
                .andExpect(jsonPath("$[0].hasPortalAccess").value(true))
                // Latest ACTIVE project wins over a later ARCHIVED one.
                .andExpect(jsonPath("$[0].currentProject.id").value(active.getId()))
                .andExpect(jsonPath("$[0].currentProject.totalFee").value(25000))
                .andExpect(jsonPath("$[0].currentProject.videos.total").value(2))
                .andExpect(jsonPath("$[0].currentProject.payment.status").value("PARTIALLY_PAID"));
    }

    @Test
    void detailIncludesInternalNotesAndAllProjects() throws Exception {
        Client client = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");
        testData.project(client, 9, 2026, "20000");
        testData.project(client, 10, 2026, "25000");

        mvc.perform(get("/api/admin/clients/" + client.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects.length()").value(2))
                .andExpect(jsonPath("$.currentProject.month").value(10));
    }

    @Test
    void updatingEmailAlsoUpdatesThePortalLogin() throws Exception {
        Client client = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        Map<String, Object> body = clientBody("coach@rahulfitness.test", false);
        body.put("phone", "+91 98765 43210");

        mvc.perform(put("/api/admin/clients/" + client.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("coach@rahulfitness.test"))
                .andExpect(jsonPath("$.phone").value("+91 98765 43210"));

        login("coach@rahulfitness.test", PASSWORD);
    }

    @Test
    void portalAccessResetIssuesANewTemporaryPassword() throws Exception {
        Client client = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);

        String response = mvc.perform(post("/api/admin/clients/" + client.getId() + "/portal-access")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String temporaryPassword = objectMapper.readTree(response).get("temporaryPassword").asText();

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "rahul@fitness.test", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "rahul@fitness.test", "password", temporaryPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.mustChangePassword").value(true));
    }

    @Test
    void clientsCannotBeDeleted() throws Exception {
        Client client = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");

        mvc.perform(delete("/api/admin/clients/" + client.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void clientUsersCannotUseClientManagement() throws Exception {
        Client client = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        String clientToken = login("rahul@fitness.test", PASSWORD);

        mvc.perform(get("/api/admin/clients").header("Authorization", bearer(clientToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/clients/" + client.getId()).header("Authorization", bearer(clientToken)))
                .andExpect(status().isForbidden());
    }

    private static Map<String, Object> clientBody(String email, boolean portalAccess) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Rahul Fitness");
        body.put("email", email);
        body.put("instagram", "@rahulfitness");
        body.put("notes", "Prefers fast cuts");
        body.put("createPortalAccess", portalAccess);
        return body;
    }
}
