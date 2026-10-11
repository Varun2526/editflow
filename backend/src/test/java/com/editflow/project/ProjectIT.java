package com.editflow.project;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.support.IntegrationTest;
import com.editflow.video.VideoStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class ProjectIT extends IntegrationTest {

    @Autowired
    Clock clock;

    private String admin;
    private Client client;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        client = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");
    }

    @Test
    void createProjectStartsActiveWithZeroedMetrics() throws Exception {
        create(client.getId(), 10, 2026, 25000)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.clientName").value("Rahul Fitness"))
                .andExpect(jsonPath("$.videos.total").value(0))
                .andExpect(jsonPath("$.videos.progressPercent").value(0.0))
                .andExpect(jsonPath("$.payment.totalPaid").value(0))
                .andExpect(jsonPath("$.payment.balance").value(25000))
                .andExpect(jsonPath("$.payment.status").value("UNPAID"));
    }

    @Test
    void oneProjectPerClientPerMonth() throws Exception {
        create(client.getId(), 10, 2026, 25000).andExpect(status().isCreated());

        create(client.getId(), 10, 2026, 30000)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Rahul Fitness already has a project for 10/2026"));

        Client other = testData.clientWithoutLogin("Urban Bites", "hello@urbanbites.test");
        create(other.getId(), 10, 2026, 18000).andExpect(status().isCreated());
    }

    @Test
    void updateCannotMoveIntoAnOccupiedMonth() throws Exception {
        testData.project(client, 9, 2026, "20000");
        Project october = testData.project(client, 10, 2026, "25000");

        mvc.perform(put("/api/admin/projects/" + october.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(projectBody(9, 2026, 25000))))
                .andExpect(status().isConflict());
    }

    @Test
    void financialsAreDerivedFromPayments() throws Exception {
        Project project = testData.project(client, 10, 2026, "25000");
        testData.payment(project, "10000", LocalDate.of(2026, 10, 1));
        testData.payment(project, "5000", LocalDate.of(2026, 10, 10));

        mvc.perform(get("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.payment.totalFee").value(25000))
                .andExpect(jsonPath("$.payment.totalPaid").value(15000))
                .andExpect(jsonPath("$.payment.balance").value(10000))
                .andExpect(jsonPath("$.payment.status").value("PARTIALLY_PAID"));
    }

    @Test
    void feeCannotDropBelowWhatHasBeenPaid() throws Exception {
        Project project = testData.project(client, 10, 2026, "25000");
        testData.payment(project, "15000", LocalDate.of(2026, 10, 1));

        mvc.perform(put("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(projectBody(10, 2026, 10000))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Project fee cannot be lower than the amount already paid (15000.00)"));

        mvc.perform(put("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(projectBody(10, 2026, 15000))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payment.status").value("PAID"));
    }

    @Test
    void progressAndOverdueAreDerivedFromVideos() throws Exception {
        Project project = testData.project(client, 10, 2026, "25000");
        LocalDate today = LocalDate.now(clock);
        // 15 videos: 4 completed + 4 delivered = 8 done -> 53.33%
        for (int i = 0; i < 4; i++) {
            testData.video(project, "Completed " + i, VideoStatus.COMPLETED, today.plusDays(3));
            testData.video(project, "Delivered " + i, VideoStatus.DELIVERED, today.minusDays(5));
        }
        testData.video(project, "Overdue editing", VideoStatus.EDITING, today.minusDays(1));
        testData.video(project, "Overdue completed", VideoStatus.COMPLETED, today.minusDays(2)); // not delivered yet
        for (int i = 0; i < 5; i++) {
            testData.video(project, "Pending " + i, VideoStatus.PENDING, today.plusDays(10));
        }

        mvc.perform(get("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.videos.total").value(15))
                .andExpect(jsonPath("$.videos.done").value(9))
                .andExpect(jsonPath("$.videos.byStatus.PENDING").value(5))
                .andExpect(jsonPath("$.videos.byStatus.COMPLETED").value(5))
                .andExpect(jsonPath("$.videos.byStatus.DELIVERED").value(4))
                .andExpect(jsonPath("$.videos.progressPercent").value(60.0))
                .andExpect(jsonPath("$.videos.overdue").value(2));
    }

    @Test
    void zeroFeeProjectIsPaid() throws Exception {
        create(client.getId(), 10, 2026, 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.payment.status").value("PAID"));
    }

    @Test
    void projectCanBeArchivedAndFilteredByStatus() throws Exception {
        Project project = testData.project(client, 10, 2026, "25000");
        testData.project(client, 11, 2026, "25000");

        mvc.perform(patch("/api/admin/projects/" + project.getId() + "/status").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "ARCHIVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mvc.perform(get("/api/admin/projects").param("status", "ARCHIVED").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(project.getId()));
        mvc.perform(get("/api/admin/projects").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void invalidProjectInputIs400AndUnknownClientIs404() throws Exception {
        create(client.getId(), 0, 2026, -5)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(2));
        create(999L, 10, 2026, 25000).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/projects").param("status", "BOGUS").header("Authorization", bearer(admin)))
                .andExpect(status().isBadRequest());
    }

    private ResultActions create(Long clientId, int month, int year, int fee) throws Exception {
        return mvc.perform(post("/api/admin/clients/" + clientId + "/projects").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(projectBody(month, year, fee))));
    }

    private static Map<String, Object> projectBody(int month, int year, int fee) {
        return Map.of("name", "October 2026 Content", "month", month, "year", year, "totalFee", fee);
    }
}
