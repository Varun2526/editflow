package com.editflow.video;

import static com.editflow.support.TestData.PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.project.Project;
import com.editflow.revision.RevisionRepository;
import com.editflow.support.IntegrationTest;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class VideoIT extends IntegrationTest {

    private static final String DRIVE = "https://drive.google.com/file/d/1AbC/view";

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    RevisionRepository revisionRepository;

    @Autowired
    Clock clock;

    private String admin;
    private Client client;
    private Project project;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        client = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        project = testData.project(client, 10, 2026, "25000");
    }

    @Test
    void createVideoStartsPendingWithOnlyMediaReceivedAllowed() throws Exception {
        mvc.perform(post("/api/admin/projects/" + project.getId() + "/videos").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(videoBody("Morning Workout Reel", DRIVE))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/admin/videos/")))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.contentType").value("REEL"))
                .andExpect(jsonPath("$.driveUrl").value(DRIVE))
                .andExpect(jsonPath("$.revisionCount").value(0))
                .andExpect(jsonPath("$.allowedTransitions[0]").value("MEDIA_RECEIVED"))
                .andExpect(jsonPath("$.allowedTransitions.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ftp://drive.google.com/x", "drive.google.com/file", "javascript:alert(1)", "https://"})
    void driveUrlMustBeHttpOrHttps(String url) throws Exception {
        mvc.perform(post("/api/admin/projects/" + project.getId() + "/videos").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(videoBody("Reel", url))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("driveUrl"))
                .andExpect(jsonPath("$.errors[0].message").value("must be a valid http or https URL"));
    }

    @Test
    void blankDriveUrlIsStoredAsNoLink() throws Exception {
        mvc.perform(post("/api/admin/projects/" + project.getId() + "/videos").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(videoBody("Reel", "  "))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.driveUrl").doesNotExist());
    }

    @Test
    void updateChangesDetailsButNeverTheStatus() throws Exception {
        Video video = testData.video(project, "Old title", LocalDate.of(2026, 10, 20));
        Map<String, Object> body = videoBody("Chest Workout", DRIVE);
        body.put("contentType", "YOUTUBE_VIDEO");
        body.put("deadline", "2026-10-25");
        body.put("status", "DELIVERED"); // not part of the update contract: ignored

        mvc.perform(put("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Chest Workout"))
                .andExpect(jsonPath("$.contentType").value("YOUTUBE_VIDEO"))
                .andExpect(jsonPath("$.deadline").value("2026-10-25"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void fullWorkflowStampsTimestampsAndUpdatesProjectProgress() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", LocalDate.now(clock).plusDays(2));

        changeStatus(video, "MEDIA_RECEIVED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MEDIA_RECEIVED"))
                .andExpect(jsonPath("$.mediaReceivedAt").isNotEmpty());
        changeStatus(video, "EDITING").andExpect(status().isOk());
        changeStatus(video, "REVIEW").andExpect(status().isOk());
        changeStatus(video, "COMPLETED")
                .andExpect(jsonPath("$.editCompletedAt").isNotEmpty())
                .andExpect(jsonPath("$.deliveredAt").doesNotExist());

        mvc.perform(get("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.videos.done").value(1))
                .andExpect(jsonPath("$.videos.progressPercent").value(100.0));

        changeStatus(video, "DELIVERED")
                .andExpect(jsonPath("$.deliveredAt").isNotEmpty())
                .andExpect(jsonPath("$.allowedTransitions[0]").value("EDITING"));
    }

    @Test
    void invalidTransitionIs409AndLeavesTheVideoUnchanged() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", null);

        changeStatus(video, "DELIVERED")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Cannot change status from PENDING to DELIVERED. Allowed: MEDIA_RECEIVED"));

        assertThat(videoRepository.findById(video.getId()).orElseThrow().getStatus()).isEqualTo(VideoStatus.PENDING);
    }

    @Test
    void backwardCorrectionClearsLaterTimestamps() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", null);
        for (String status : new String[] {"MEDIA_RECEIVED", "EDITING", "REVIEW", "COMPLETED", "DELIVERED"}) {
            changeStatus(video, status).andExpect(status().isOk());
        }

        changeStatus(video, "EDITING")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EDITING"))
                .andExpect(jsonPath("$.mediaReceivedAt").isNotEmpty())
                .andExpect(jsonPath("$.editCompletedAt").doesNotExist())
                .andExpect(jsonPath("$.deliveredAt").doesNotExist());
    }

    @Test
    void clientCannotChangeVideoStatus() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", null);
        String clientToken = login("rahul@fitness.test", PASSWORD);

        mvc.perform(patch("/api/admin/videos/" + video.getId() + "/status").header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "MEDIA_RECEIVED"))))
                .andExpect(status().isForbidden());
        // There is no status endpoint in the client portal at all.
        mvc.perform(patch("/api/client/me/videos/" + video.getId() + "/status").header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "MEDIA_RECEIVED"))))
                .andExpect(status().is4xxClientError());

        assertThat(videoRepository.findById(video.getId()).orElseThrow().getStatus()).isEqualTo(VideoStatus.PENDING);
    }

    @Test
    void listIsOrderedByDeadlineWithDerivedOverdueAndRevisionCounts() throws Exception {
        LocalDate today = LocalDate.now(clock);
        Video later = testData.video(project, "Back Workout", today.plusDays(5));
        Video overdue = testData.video(project, "Protein Myths", VideoStatus.EDITING, today.minusDays(1));
        testData.video(project, "Delivered late", VideoStatus.DELIVERED, today.minusDays(3));
        testData.revision(overdue, "00:17", "Make this transition faster");
        testData.revision(overdue, "01:02", "Brighter colour grade");

        mvc.perform(get("/api/admin/projects/" + project.getId() + "/videos").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Delivered late"))
                .andExpect(jsonPath("$[0].overdue").value(false))
                .andExpect(jsonPath("$[1].id").value(overdue.getId()))
                .andExpect(jsonPath("$[1].overdue").value(true))
                .andExpect(jsonPath("$[1].revisionCount").value(2))
                .andExpect(jsonPath("$[1].openRevisionCount").value(2))
                .andExpect(jsonPath("$[2].id").value(later.getId()));
    }

    @Test
    void detailIncludesRevisionsAndClient() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", VideoStatus.REVIEW, null);
        testData.revision(video, "00:17", "Make this transition faster");

        mvc.perform(get("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.video.title").value("Morning Workout Reel"))
                .andExpect(jsonPath("$.clientName").value("Rahul Fitness"))
                .andExpect(jsonPath("$.revisions[0].timecode").value("00:17"))
                .andExpect(jsonPath("$.revisions[0].status").value("OPEN"));
    }

    @Test
    void deleteRemovesVideoAndItsRevisions() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", VideoStatus.REVIEW, null);
        testData.revision(video, "00:17", "Make this transition faster");

        mvc.perform(delete("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());

        assertThat(videoRepository.existsById(video.getId())).isFalse();
        assertThat(revisionRepository.count()).isZero();
        mvc.perform(delete("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deliveredVideosCannotBeDeleted() throws Exception {
        Video video = testData.video(project, "Morning Workout Reel", VideoStatus.DELIVERED, null);

        mvc.perform(delete("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Delivered videos cannot be deleted"));
    }

    @Test
    void videoIndexListsVideosOutsideArchivedProjectsWithStatusFilter() throws Exception {
        testData.video(project, "In editing", VideoStatus.EDITING, null);
        testData.video(project, "Pending", null);
        Project archived = testData.project(client, 9, 2026, "1000", com.editflow.project.ProjectStatus.ARCHIVED);
        testData.video(archived, "Archived editing", VideoStatus.EDITING, null);

        mvc.perform(get("/api/admin/videos").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].clientName").value("Rahul Fitness"));
        mvc.perform(get("/api/admin/videos").param("status", "EDITING").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].video.title").value("In editing"))
                .andExpect(jsonPath("$[0].projectName").value(project.getName()));
        mvc.perform(get("/api/admin/videos").header("Authorization", bearer(login("rahul@fitness.test", PASSWORD))))
                .andExpect(status().isForbidden());
    }

    private ResultActions changeStatus(Video video, String status) throws Exception {
        return mvc.perform(patch("/api/admin/videos/" + video.getId() + "/status").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", status))));
    }

    private static Map<String, Object> videoBody(String title, String driveUrl) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("contentType", "REEL");
        body.put("deadline", "2026-10-20");
        body.put("driveUrl", driveUrl);
        return body;
    }
}
