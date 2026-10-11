package com.editflow.inquiry;

import static com.editflow.support.TestData.PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.project.ProjectRepository;
import com.editflow.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class InquiryIT extends IntegrationTest {

    @Autowired
    InquiryRepository inquiryRepository;

    @Autowired
    ClientRepository clientRepository;

    @Autowired
    ProjectRepository projectRepository;

    private String admin;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
    }

    @Test
    void publicCanSubmitAnInquiryWhichStartsPending() throws Exception {
        long id = submitInquiry("rahul@fitness.test");

        mvc.perform(get("/api/admin/inquiries").param("status", "PENDING").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].videosPerMonth").value(15))
                .andExpect(jsonPath("$[0].budget").value(25000));
    }

    @Test
    void inquiryInputIsValidated() throws Exception {
        Map<String, Object> body = inquiryBody("not-an-email");
        body.put("budget", -1);
        body.put("videosPerMonth", 0);
        body.put("name", " ");

        mvc.perform(post("/api/public/inquiries").contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItems("email", "budget", "videosPerMonth", "name")));
    }

    @Test
    void acceptCreatesClientPortalLoginAndProject() throws Exception {
        long id = submitInquiry("Rahul@Fitness.test");

        JsonNode response = readJson(accept(id, 10, 2026)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inquiry.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.clientCreated").value(true))
                .andExpect(jsonPath("$.portalAccess.email").value("rahul@fitness.test"))
                .andExpect(jsonPath("$.portalAccess.temporaryPassword").isNotEmpty()));

        long clientId = response.get("clientId").asLong();
        long projectId = response.get("projectId").asLong();
        assertThat(response.at("/inquiry/clientId").asLong()).isEqualTo(clientId);
        assertThat(response.at("/inquiry/projectId").asLong()).isEqualTo(projectId);

        mvc.perform(get("/api/admin/projects/" + projectId).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.clientId").value(clientId))
                .andExpect(jsonPath("$.name").value("October 2026 Content"))
                .andExpect(jsonPath("$.month").value(10))
                .andExpect(jsonPath("$.totalFee").value(25000))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // The temporary password works and must be changed on first login.
        String temporaryPassword = response.at("/portalAccess/temporaryPassword").asText();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "rahul@fitness.test", "password", temporaryPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("CLIENT"))
                .andExpect(jsonPath("$.user.mustChangePassword").value(true));
    }

    @Test
    void acceptReusesExistingClientByEmail() throws Exception {
        Client existing = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        testData.project(existing, 9, 2026, "20000");
        long id = submitInquiry("RAHUL@fitness.test");

        accept(id, 10, 2026)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clientId").value(existing.getId()))
                .andExpect(jsonPath("$.clientCreated").value(false))
                .andExpect(jsonPath("$.portalAccess").doesNotExist());

        assertThat(clientRepository.count()).isEqualTo(1);
        assertThat(projectRepository.count()).isEqualTo(2);
    }

    @Test
    void acceptGivesPortalAccessToExistingClientWithoutOne() throws Exception {
        Client existing = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");
        long id = submitInquiry("rahul@fitness.test");

        accept(id, 10, 2026)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clientId").value(existing.getId()))
                .andExpect(jsonPath("$.clientCreated").value(false))
                .andExpect(jsonPath("$.portalAccess.temporaryPassword").isNotEmpty());
    }

    @Test
    void acceptIsRejectedWhenTheClientAlreadyHasAProjectThatMonth() throws Exception {
        Client existing = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        testData.project(existing, 10, 2026, "20000");
        long id = submitInquiry("rahul@fitness.test");

        accept(id, 10, 2026)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Rahul Fitness already has a project for 10/2026"));

        assertThat(inquiryRepository.findById(id).orElseThrow().getStatus()).isEqualTo(InquiryStatus.PENDING);
        assertThat(projectRepository.count()).isEqualTo(1);
    }

    @Test
    void acceptingTwiceIs409() throws Exception {
        long id = submitInquiry("rahul@fitness.test");
        accept(id, 10, 2026).andExpect(status().isCreated());

        accept(id, 11, 2026)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Inquiry has already been accepted"));
        assertThat(projectRepository.count()).isEqualTo(1);
    }

    @Test
    void concurrentAcceptsCreateExactlyOneClientAndProject() throws Exception {
        long id = submitInquiry("rahul@fitness.test");
        String body = json(acceptBody(10, 2026));
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            results.add(pool.submit(() -> {
                start.await();
                return mvc.perform(post("/api/admin/inquiries/" + id + "/accept")
                                .header("Authorization", bearer(admin))
                                .contentType(MediaType.APPLICATION_JSON).content(body))
                        .andReturn().getResponse().getStatus();
            }));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> result : results) {
            statuses.add(result.get());
        }
        pool.shutdown();

        assertThat(statuses).containsExactlyInAnyOrder(201, 409);
        assertThat(clientRepository.count()).isEqualTo(1);
        assertThat(projectRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectOnlyWorksOnPendingInquiries() throws Exception {
        long id = submitInquiry("rahul@fitness.test");

        mvc.perform(post("/api/admin/inquiries/" + id + "/reject").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(post("/api/admin/inquiries/" + id + "/reject").header("Authorization", bearer(admin)))
                .andExpect(status().isConflict());
        accept(id, 10, 2026)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Inquiry has already been rejected"));
        assertThat(clientRepository.count()).isZero();
    }

    @Test
    void acceptIsRefusedWhenTheEmailBelongsToTheAdmin() throws Exception {
        long id = submitInquiry("admin@editflow.test");

        accept(id, 10, 2026).andExpect(status().isConflict());
        assertThat(clientRepository.count()).isZero();
    }

    @Test
    void acceptRequestIsValidated() throws Exception {
        long id = submitInquiry("rahul@fitness.test");

        accept(id, 13, 2026)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("month"));
    }

    @Test
    void inquiryManagementIsAdminOnly() throws Exception {
        testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        String client = login("rahul@fitness.test", PASSWORD);

        mvc.perform(get("/api/admin/inquiries").header("Authorization", bearer(client)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/inquiries")).andExpect(status().isUnauthorized());
    }

    @Test
    void unknownInquiryIs404() throws Exception {
        mvc.perform(get("/api/admin/inquiries/999").header("Authorization", bearer(admin)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Inquiry 999 not found"));
    }

    private long submitInquiry(String email) throws Exception {
        String response = mvc.perform(post("/api/public/inquiries")
                        .contentType(MediaType.APPLICATION_JSON).content(json(inquiryBody(email))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Thanks! Your inquiry has been submitted."))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private ResultActions accept(long id, int month, int year) throws Exception {
        return mvc.perform(post("/api/admin/inquiries/" + id + "/accept")
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(acceptBody(month, year))));
    }

    private JsonNode readJson(ResultActions actions) throws Exception {
        return objectMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private static Map<String, Object> inquiryBody(String email) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Rahul Fitness");
        body.put("email", email);
        body.put("phoneOrInstagram", "@rahulfitness");
        body.put("contentType", "Reels + YouTube");
        body.put("videosPerMonth", 15);
        body.put("budget", 25000);
        body.put("description", "Monthly gym content");
        return body;
    }

    private static Map<String, Object> acceptBody(int month, int year) {
        return Map.of("projectName", "October 2026 Content", "month", month, "year", year, "totalFee", 25000);
    }
}
