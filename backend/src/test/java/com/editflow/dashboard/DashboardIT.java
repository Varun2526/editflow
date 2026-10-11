package com.editflow.dashboard;

import static com.editflow.support.TestData.PASSWORD;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.inquiry.Inquiry;
import com.editflow.inquiry.InquiryRepository;
import com.editflow.project.Project;
import com.editflow.project.ProjectStatus;
import com.editflow.support.IntegrationTest;
import com.editflow.video.Video;
import com.editflow.video.VideoStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class DashboardIT extends IntegrationTest {

    @Autowired
    InquiryRepository inquiryRepository;

    @Autowired
    Clock clock;

    private String admin;
    private LocalDate today;
    private Project active;
    private Video editing;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        today = LocalDate.now(clock);
        Client rahul = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        Client urban = testData.clientWithoutLogin("Urban Bites", "hello@urbanbites.test");

        active = testData.project(rahul, 10, 2026, "25000");
        testData.video(active, "Due today", VideoStatus.PENDING, today);
        editing = testData.video(active, "Overdue in editing", VideoStatus.EDITING, today.minusDays(2));
        Video review = testData.video(active, "In review", VideoStatus.REVIEW, today.plusDays(3));
        testData.video(active, "Delivered late (not overdue)", VideoStatus.DELIVERED, today.minusDays(5));
        testData.revision(review, "00:17", "Make this transition faster");
        testData.payment(active, "10000", today);

        Project completed = testData.project(urban, 9, 2026, "18000", ProjectStatus.COMPLETED);
        testData.video(completed, "Old video", VideoStatus.DELIVERED, today.minusDays(30));
        testData.payment(completed, "18000", today.minusDays(20));
        Project archived = testData.project(urban, 8, 2026, "99999", ProjectStatus.ARCHIVED);
        testData.video(archived, "Archived pending", VideoStatus.PENDING, today.minusDays(60));

        inquiryRepository.save(new Inquiry("Priya Talks", "priya@podcast.test", "@priyatalks", "Podcast",
                4, new BigDecimal("15000"), null, null));
    }

    @Test
    void summaryIsDerivedFromRecords() throws Exception {
        mvc.perform(get("/api/admin/dashboard/summary").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClients").value(2))
                .andExpect(jsonPath("$.activeProjects").value(1))
                .andExpect(jsonPath("$.pendingInquiries").value(1))
                .andExpect(jsonPath("$.openRevisions").value(1))
                // Active projects only: archived "pending" video is excluded.
                .andExpect(jsonPath("$.videos.total").value(4))
                .andExpect(jsonPath("$.videos.byStatus.PENDING").value(1))
                .andExpect(jsonPath("$.videos.byStatus.EDITING").value(1))
                .andExpect(jsonPath("$.videos.byStatus.REVIEW").value(1))
                .andExpect(jsonPath("$.videos.byStatus.DELIVERED").value(1))
                .andExpect(jsonPath("$.videos.done").value(1))
                .andExpect(jsonPath("$.videos.progressPercent").value(25.0))
                .andExpect(jsonPath("$.videos.overdue").value(1))
                // Active + completed: 25000 + 18000 fees, 10000 + 18000 paid.
                .andExpect(jsonPath("$.totalFees").value(43000))
                .andExpect(jsonPath("$.totalPaid").value(28000))
                .andExpect(jsonPath("$.outstanding").value(15000));
    }

    @Test
    void summaryChangesImmediatelyWhenRecordsChange() throws Exception {
        for (String status : new String[] {"REVIEW", "COMPLETED"}) {
            mvc.perform(patch("/api/admin/videos/" + editing.getId() + "/status").header("Authorization", bearer(admin))
                    .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", status))))
                    .andExpect(status().isOk());
        }

        mvc.perform(get("/api/admin/dashboard/summary").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.videos.byStatus.EDITING").value(0))
                .andExpect(jsonPath("$.videos.byStatus.COMPLETED").value(1))
                .andExpect(jsonPath("$.videos.done").value(2))
                .andExpect(jsonPath("$.videos.progressPercent").value(50.0))
                // Completed but undelivered and past deadline: still overdue.
                .andExpect(jsonPath("$.videos.overdue").value(1));
    }

    @Test
    void tasksListDueOverdueEditingReviewAndOpenRevisions() throws Exception {
        mvc.perform(get("/api/admin/dashboard/tasks").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.today").value(today.toString()))
                .andExpect(jsonPath("$.dueToday.length()").value(1))
                .andExpect(jsonPath("$.dueToday[0].title").value("Due today"))
                .andExpect(jsonPath("$.overdue.length()").value(1))
                .andExpect(jsonPath("$.overdue[0].title").value("Overdue in editing"))
                .andExpect(jsonPath("$.overdue[0].clientName").value("Rahul Fitness"))
                .andExpect(jsonPath("$.inEditing.length()").value(1))
                .andExpect(jsonPath("$.inReview[0].title").value("In review"))
                .andExpect(jsonPath("$.openRevisions[0].timecode").value("00:17"))
                .andExpect(jsonPath("$.openRevisions[0].videoTitle").value("In review"));
    }

    @Test
    void dashboardIsAdminOnly() throws Exception {
        String client = login("rahul@fitness.test", PASSWORD);

        mvc.perform(get("/api/admin/dashboard/summary").header("Authorization", bearer(client)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard/tasks")).andExpect(status().isUnauthorized());
    }
}
