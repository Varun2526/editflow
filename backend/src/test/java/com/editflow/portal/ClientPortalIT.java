package com.editflow.portal;

import static com.editflow.support.TestData.PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.project.Project;
import com.editflow.revision.RevisionRepository;
import com.editflow.support.IntegrationTest;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Client portal behaviour and, critically, isolation between clients (second authorization layer). */
class ClientPortalIT extends IntegrationTest {

    @Autowired
    ClientRepository clientRepository;

    @Autowired
    RevisionRepository revisionRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    Clock clock;

    private String admin;
    private String rahul;
    private Project rahulProject;
    private Video rahulReviewVideo;
    private Video rahulPendingVideo;
    private Project urbanProject;
    private Video urbanVideo;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        LocalDate today = LocalDate.now(clock);

        Client rahulClient = testData.clientWithLogin("Rahul Fitness", "rahul@fitness.test", false);
        rahulClient.setNotes("Internal: pays late");
        clientRepository.save(rahulClient);
        testData.project(rahulClient, 9, 2026, "20000");
        rahulProject = testData.project(rahulClient, 10, 2026, "25000");
        rahulReviewVideo = testData.video(rahulProject, "Morning Workout Reel", VideoStatus.REVIEW, today.plusDays(1));
        rahulPendingVideo = testData.video(rahulProject, "Nutrition Tips", VideoStatus.PENDING, today.plusDays(4));
        testData.video(rahulProject, "Chest Workout", VideoStatus.DELIVERED, today.minusDays(2));
        testData.payment(rahulProject, "10000", today.minusDays(10));

        Client urbanClient = testData.clientWithLogin("Urban Bites", "hello@urbanbites.test", false);
        urbanProject = testData.project(urbanClient, 10, 2026, "18000");
        urbanVideo = testData.video(urbanProject, "Menu Launch Reel", VideoStatus.REVIEW, today.plusDays(2));
        testData.payment(urbanProject, "18000", today.minusDays(3));

        rahul = login("rahul@fitness.test", PASSWORD);
    }

    // ---------- own data ----------

    @Test
    void profileIsTheCallersOwnWithoutInternalNotes() throws Exception {
        portalGet("/profile")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rahul Fitness"))
                .andExpect(jsonPath("$.email").value("rahul@fitness.test"))
                .andExpect(jsonPath("$.notes").doesNotExist());
    }

    @Test
    void dashboardShowsCurrentProjectProgressPaymentsAndDeadlines() throws Exception {
        portalGet("/dashboard")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientName").value("Rahul Fitness"))
                .andExpect(jsonPath("$.currentProject.id").value(rahulProject.getId()))
                .andExpect(jsonPath("$.currentProject.videos.total").value(3))
                .andExpect(jsonPath("$.currentProject.videos.done").value(1))
                .andExpect(jsonPath("$.currentProject.videos.progressPercent").value(33.33))
                .andExpect(jsonPath("$.currentProject.payment.totalPaid").value(10000))
                .andExpect(jsonPath("$.currentProject.payment.balance").value(15000))
                .andExpect(jsonPath("$.currentProject.payment.status").value("PARTIALLY_PAID"))
                .andExpect(jsonPath("$.upcomingDeadlines.length()").value(2))
                .andExpect(jsonPath("$.upcomingDeadlines[0].title").value("Morning Workout Reel"));
    }

    @Test
    void projectsListContainsOnlyTheCallersProjects() throws Exception {
        portalGet("/projects")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].clientName").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("Rahul Fitness"))));
    }

    @Test
    void ownProjectVideosAndPaymentsAreVisible() throws Exception {
        portalGet("/projects/" + rahulProject.getId()).andExpect(status().isOk());
        portalGet("/projects/" + rahulProject.getId() + "/videos")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].allowedTransitions").doesNotExist());
        portalGet("/projects/" + rahulProject.getId() + "/payments")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.totalFee").value(25000))
                .andExpect(jsonPath("$.summary.totalPaid").value(10000))
                .andExpect(jsonPath("$.summary.balance").value(15000))
                .andExpect(jsonPath("$.payments.length()").value(1));
    }

    // ---------- isolation: client A cannot reach client B ----------

    @Test
    void anotherClientsProjectIsForbidden() throws Exception {
        portalGet("/projects/" + urbanProject.getId())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this project"));
        portalGet("/projects/" + urbanProject.getId() + "/videos").andExpect(status().isForbidden());
        portalGet("/projects/" + urbanProject.getId() + "/payments").andExpect(status().isForbidden());
    }

    @Test
    void anotherClientsVideoIsForbidden() throws Exception {
        portalGet("/videos/" + urbanVideo.getId())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this video"));
    }

    @Test
    void cannotRequestARevisionOnAnotherClientsVideo() throws Exception {
        requestRevision(urbanVideo, "00:17", "Sneaky change").andExpect(status().isForbidden());

        assertThat(revisionRepository.count()).isZero();
    }

    @Test
    void unknownResourcesAre404() throws Exception {
        portalGet("/projects/99999").andExpect(status().isNotFound());
        portalGet("/videos/99999").andExpect(status().isNotFound());
    }

    @Test
    void clientCannotUseAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/projects/" + rahulProject.getId()).header("Authorization", bearer(rahul)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/clients").header("Authorization", bearer(rahul)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/projects/" + rahulProject.getId() + "/payments").header("Authorization", bearer(rahul)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotUseThePortal() throws Exception {
        mvc.perform(get("/api/client/me/projects").header("Authorization", bearer(admin)))
                .andExpect(status().isForbidden());
    }

    @Test
    void portalRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/client/me/dashboard")).andExpect(status().isUnauthorized());
    }

    // ---------- revisions (demo steps 9-10) ----------

    @Test
    void clientRequestsRevisionAdminResolvesClientSeesResolution() throws Exception {
        String body = requestRevision(rahulReviewVideo, "00:17", "Make this transition faster.")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.requestedBy").value("CLIENT"))
                .andReturn().getResponse().getContentAsString();
        long revisionId = objectMapper.readTree(body).get("id").asLong();

        // The video's status is untouched: the admin decides what happens next.
        assertThat(videoRepository.findById(rahulReviewVideo.getId()).orElseThrow().getStatus())
                .isEqualTo(VideoStatus.REVIEW);

        mvc.perform(get("/api/admin/dashboard/tasks").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.openRevisions[0].id").value(revisionId))
                .andExpect(jsonPath("$.openRevisions[0].clientName").value("Rahul Fitness"));
        mvc.perform(post("/api/admin/revisions/" + revisionId + "/resolve").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());

        portalGet("/videos/" + rahulReviewVideo.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.video.revisionCount").value(1))
                .andExpect(jsonPath("$.video.openRevisionCount").value(0))
                .andExpect(jsonPath("$.revisions[0].status").value("RESOLVED"))
                .andExpect(jsonPath("$.revisions[0].resolvedAt").isNotEmpty());
    }

    @Test
    void revisionsWaitUntilTheVideoIsReadyForReview() throws Exception {
        requestRevision(rahulPendingVideo, "00:17", "Too early")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Revisions can be requested once the video is ready for review"));
    }

    @Test
    void clientRevisionTimecodeIsValidated() throws Exception {
        requestRevision(rahulReviewVideo, "17", "Bad timecode")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("timecode"));
        requestRevision(rahulReviewVideo, "01:00:17", "Valid long-form timecode")
                .andExpect(status().isCreated());
    }

    @Test
    void temporaryPasswordBlocksThePortalUntilChanged() throws Exception {
        testData.clientWithLogin("Priya Talks", "priya@podcast.test", true);
        String temporary = login("priya@podcast.test", PASSWORD);

        mvc.perform(get("/api/client/me/dashboard").header("Authorization", bearer(temporary)))
                .andExpect(status().isForbidden());
    }

    // ---------- client approval ----------

    @Test
    void clientApprovesTheirOwnVideoInReview() throws Exception {
        approve(rahulReviewVideo)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(rahulReviewVideo.getId()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.approvedAt").isNotEmpty())
                .andExpect(jsonPath("$.deliveredAt").isEmpty());

        Video saved = videoRepository.findById(rahulReviewVideo.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(VideoStatus.COMPLETED);
        assertThat(saved.getApprovedAt()).isNotNull();
        assertThat(saved.getEditCompletedAt()).isNotNull();

        // The admin sees the approval and the next step is delivery.
        mvc.perform(get("/api/admin/videos/" + rahulReviewVideo.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.video.status").value("COMPLETED"))
                .andExpect(jsonPath("$.video.approvedAt").isNotEmpty())
                .andExpect(jsonPath("$.video.allowedTransitions[0]").value("DELIVERED"));
    }

    @Test
    void clientCannotApproveAnotherClientsVideo() throws Exception {
        approve(urbanVideo)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this video"));

        Video untouched = videoRepository.findById(urbanVideo.getId()).orElseThrow();
        assertThat(untouched.getStatus()).isEqualTo(VideoStatus.REVIEW);
        assertThat(untouched.getApprovedAt()).isNull();
    }

    @Test
    void approvingAnUnknownVideoIs404() throws Exception {
        mvc.perform(post("/api/client/me/videos/99999/approve").header("Authorization", bearer(rahul)))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyAVideoInReviewCanBeApproved() throws Exception {
        approve(rahulPendingVideo)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Only a video that is ready for your review can be approved"));
        assertThat(videoRepository.findById(rahulPendingVideo.getId()).orElseThrow().getStatus())
                .isEqualTo(VideoStatus.PENDING);

        // Approving twice is rejected too (already COMPLETED).
        approve(rahulReviewVideo).andExpect(status().isOk());
        approve(rahulReviewVideo).andExpect(status().isConflict());
    }

    @Test
    void cannotApproveWhileOwnChangeRequestsAreOpen() throws Exception {
        requestRevision(rahulReviewVideo, "00:17", "Faster transition").andExpect(status().isCreated());

        approve(rahulReviewVideo)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This video has open change requests — your editor is still working on them"));
        assertThat(videoRepository.findById(rahulReviewVideo.getId()).orElseThrow().getStatus())
                .isEqualTo(VideoStatus.REVIEW);
    }

    @Test
    void adminCannotUseTheClientApprovalEndpoint() throws Exception {
        mvc.perform(post("/api/client/me/videos/" + rahulReviewVideo.getId() + "/approve").header("Authorization", bearer(admin)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/client/me/videos/" + rahulReviewVideo.getId() + "/approve"))
                .andExpect(status().isUnauthorized());

        assertThat(videoRepository.findById(rahulReviewVideo.getId()).orElseThrow().getStatus())
                .isEqualTo(VideoStatus.REVIEW);
    }

    @Test
    void revisionLoopReturnsToReviewAndThenTheClientApproves() throws Exception {
        // Client asks for a change; editor takes the video back into editing and resolves it.
        String body = requestRevision(rahulReviewVideo, "00:17", "Faster transition")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long revisionId = objectMapper.readTree(body).get("id").asLong();
        adminStatus(rahulReviewVideo, "EDITING").andExpect(status().isOk());
        mvc.perform(post("/api/admin/revisions/" + revisionId + "/resolve").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());

        // Can't approve while it's being edited.
        approve(rahulReviewVideo).andExpect(status().isConflict());

        // Back to review, the client approves.
        adminStatus(rahulReviewVideo, "REVIEW").andExpect(status().isOk());
        approve(rahulReviewVideo)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.revisionCount").value(1))
                .andExpect(jsonPath("$.openRevisionCount").value(0));
    }

    @Test
    void movingAnApprovedVideoBackBeforeCompletedClearsTheApproval() throws Exception {
        approve(rahulReviewVideo).andExpect(status().isOk());
        adminStatus(rahulReviewVideo, "REVIEW").andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedAt").isEmpty());

        // Delivery after approval keeps the approval stamp.
        approve(rahulReviewVideo).andExpect(status().isOk());
        adminStatus(rahulReviewVideo, "DELIVERED").andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedAt").isNotEmpty())
                .andExpect(jsonPath("$.deliveredAt").isNotEmpty());
    }

    @Test
    void approvalDoesNotTouchPayments() throws Exception {
        approve(rahulReviewVideo).andExpect(status().isOk());

        portalGet("/projects/" + rahulProject.getId() + "/payments")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.totalPaid").value(10000.00))
                .andExpect(jsonPath("$.summary.status").value("PARTIALLY_PAID"));
    }

    private ResultActions portalGet(String path) throws Exception {
        return mvc.perform(get("/api/client/me" + path).header("Authorization", bearer(rahul)));
    }

    private ResultActions requestRevision(Video video, String timecode, String comment) throws Exception {
        return mvc.perform(post("/api/client/me/videos/" + video.getId() + "/revisions")
                .header("Authorization", bearer(rahul))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("timecode", timecode, "comment", comment))));
    }

    private ResultActions approve(Video video) throws Exception {
        return mvc.perform(post("/api/client/me/videos/" + video.getId() + "/approve").header("Authorization", bearer(rahul)));
    }

    private ResultActions adminStatus(Video video, String target) throws Exception {
        return mvc.perform(patch("/api/admin/videos/" + video.getId() + "/status")
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", target))));
    }
}
