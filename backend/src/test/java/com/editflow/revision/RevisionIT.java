package com.editflow.revision;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.project.Project;
import com.editflow.support.IntegrationTest;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStatus;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Admin side of revisions. Client-side creation and ownership are covered in ClientPortalIT. */
class RevisionIT extends IntegrationTest {

    @Autowired
    VideoRepository videoRepository;

    private String admin;
    private Video video;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        Project project = testData.project(
                testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test"), 10, 2026, "25000");
        video = testData.video(project, "Morning Workout Reel", VideoStatus.EDITING, null);
    }

    @ParameterizedTest
    @ValueSource(strings = {"00:17", "59:59", "1:02:03", "12:00:00"})
    void validTimecodesAreAccepted(String timecode) throws Exception {
        create(timecode, "Make this transition faster")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.timecode").value(timecode))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.requestedBy").value("ADMIN"))
                .andExpect(jsonPath("$.requestedAt").isNotEmpty())
                .andExpect(jsonPath("$.resolvedAt").doesNotExist());
    }

    @ParameterizedTest
    @ValueSource(strings = {"17", "0:17", "00:60", "1:2:3", "123:00:00", "aa:bb", "00:17 "})
    void invalidTimecodesAreRejected(String timecode) throws Exception {
        create(timecode, "Comment")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("timecode"))
                .andExpect(jsonPath("$.errors[0].message").value("must be in mm:ss or hh:mm:ss format"));
    }

    @Test
    void creatingARevisionDoesNotChangeTheVideoStatus() throws Exception {
        create("00:17", "Make this transition faster").andExpect(status().isCreated());

        assertThat(videoRepository.findById(video.getId()).orElseThrow().getStatus()).isEqualTo(VideoStatus.EDITING);
    }

    @Test
    void adminResolvesARevisionOnce() throws Exception {
        String body = create("00:17", "Make this transition faster").andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();

        mvc.perform(post("/api/admin/revisions/" + id + "/resolve").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());
        mvc.perform(post("/api/admin/revisions/" + id + "/resolve").header("Authorization", bearer(admin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Revision is already resolved"));
    }

    @Test
    void revisionCountIsDerivedFromRecords() throws Exception {
        create("00:17", "One").andExpect(status().isCreated());
        String body = create("00:30", "Two").andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();
        mvc.perform(post("/api/admin/revisions/" + id + "/resolve").header("Authorization", bearer(admin)));

        mvc.perform(get("/api/admin/videos/" + video.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.video.revisionCount").value(2))
                .andExpect(jsonPath("$.video.openRevisionCount").value(1))
                .andExpect(jsonPath("$.revisions.length()").value(2));
        mvc.perform(get("/api/admin/videos/" + video.getId() + "/revisions").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void revisionIndexFiltersByStatus() throws Exception {
        create("00:17", "Open one").andExpect(status().isCreated());
        String body = create("00:30", "Resolved one").andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/admin/revisions/" + objectMapper.readTree(body).get("id").asLong() + "/resolve")
                .header("Authorization", bearer(admin)));

        mvc.perform(get("/api/admin/revisions").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/admin/revisions").param("status", "OPEN").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].revision.comment").value("Open one"))
                .andExpect(jsonPath("$[0].videoTitle").value("Morning Workout Reel"))
                .andExpect(jsonPath("$[0].clientName").value("Rahul Fitness"));
    }

    @Test
    void unknownVideoOrRevisionIs404() throws Exception {
        mvc.perform(post("/api/admin/videos/999/revisions").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("timecode", "00:17", "comment", "x"))))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/admin/revisions/999/resolve").header("Authorization", bearer(admin)))
                .andExpect(status().isNotFound());
    }

    private ResultActions create(String timecode, String comment) throws Exception {
        return mvc.perform(post("/api/admin/videos/" + video.getId() + "/revisions").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("timecode", timecode, "comment", comment))));
    }
}
