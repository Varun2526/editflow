package com.editflow.video;

import static com.editflow.video.VideoStatus.COMPLETED;
import static com.editflow.video.VideoStatus.DELIVERED;
import static com.editflow.video.VideoStatus.EDITING;
import static com.editflow.video.VideoStatus.MEDIA_RECEIVED;
import static com.editflow.video.VideoStatus.PENDING;
import static com.editflow.video.VideoStatus.REVIEW;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.editflow.common.exception.ConflictException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class VideoWorkflowTest {

    private final TickingClock clock = new TickingClock(Instant.parse("2026-10-11T05:00:00Z"));
    private final VideoWorkflow workflow = new VideoWorkflow(clock);

    @ParameterizedTest
    @CsvSource({
            "PENDING, MEDIA_RECEIVED",
            "MEDIA_RECEIVED, EDITING",
            "EDITING, REVIEW",
            "REVIEW, COMPLETED",
            "COMPLETED, DELIVERED"})
    void everyForwardStepIsAllowed(VideoStatus from, VideoStatus to) {
        Video video = videoAt(from);

        workflow.transition(video, to);

        assertThat(video.getStatus()).isEqualTo(to);
    }

    @Test
    void clientApprovalCompletesAReviewAndStampsTheApproval() {
        Video video = videoAt(REVIEW);

        Instant approved = clock.tick();
        workflow.approveByClient(video, 0);

        assertThat(video.getStatus()).isEqualTo(COMPLETED);
        assertThat(video.getApprovedAt()).isEqualTo(approved);
        assertThat(video.getEditCompletedAt()).isEqualTo(approved);
    }

    @ParameterizedTest
    @CsvSource({"PENDING", "MEDIA_RECEIVED", "EDITING", "COMPLETED", "DELIVERED"})
    void clientApprovalOnlyFromReview(VideoStatus from) {
        Video video = videoAt(from);

        assertThatThrownBy(() -> workflow.approveByClient(video, 0))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Only a video that is ready for your review can be approved");
        assertThat(video.getStatus()).isEqualTo(from);
        assertThat(video.getApprovedAt()).isNull();
    }

    @Test
    void clientApprovalBlockedWhileChangeRequestsAreOpen() {
        Video video = videoAt(REVIEW);

        assertThatThrownBy(() -> workflow.approveByClient(video, 2)).isInstanceOf(ConflictException.class);
        assertThat(video.getStatus()).isEqualTo(REVIEW);
    }

    @Test
    void reopeningAnApprovedVideoClearsTheApprovalButDeliveryKeepsIt() {
        Video reopened = videoAt(REVIEW);
        workflow.approveByClient(reopened, 0);
        workflow.transition(reopened, REVIEW);
        assertThat(reopened.getApprovedAt()).isNull();

        Video delivered = videoAt(REVIEW);
        workflow.approveByClient(delivered, 0);
        workflow.transition(delivered, DELIVERED);
        assertThat(delivered.getApprovedAt()).isNotNull();
    }

    @Test
    void forwardStepsStampTheirStageTimestamps() {
        Video video = new Video(null, "Morning Workout Reel", ContentType.REEL);

        Instant received = clock.tick();
        workflow.transition(video, MEDIA_RECEIVED);
        assertThat(video.getMediaReceivedAt()).isEqualTo(received);

        workflow.transition(video, EDITING);
        workflow.transition(video, REVIEW);
        Instant completed = clock.tick();
        workflow.transition(video, COMPLETED);
        assertThat(video.getEditCompletedAt()).isEqualTo(completed);
        assertThat(video.getDeliveredAt()).isNull();

        Instant delivered = clock.tick();
        workflow.transition(video, DELIVERED);
        assertThat(video.getDeliveredAt()).isEqualTo(delivered);
        assertThat(video.getMediaReceivedAt()).isEqualTo(received);
        assertThat(video.getEditCompletedAt()).isEqualTo(completed);
    }

    @ParameterizedTest
    @CsvSource({
            "PENDING, EDITING",
            "PENDING, DELIVERED",
            "MEDIA_RECEIVED, REVIEW",
            "EDITING, COMPLETED",
            "REVIEW, DELIVERED",
            "DELIVERED, PENDING",
            "COMPLETED, PENDING",
            "REVIEW, PENDING"})
    void skippingStepsOrArbitraryJumpsAreRejected(VideoStatus from, VideoStatus to) {
        Video video = videoAt(from);

        assertThatThrownBy(() -> workflow.transition(video, to))
                .isInstanceOf(ConflictException.class)
                .hasMessageStartingWith("Cannot change status from " + from + " to " + to);
        assertThat(video.getStatus()).isEqualTo(from);
    }

    @Test
    void rejectionMessageListsTheAllowedOptions() {
        assertThatThrownBy(() -> workflow.transition(videoAt(PENDING), DELIVERED))
                .hasMessage("Cannot change status from PENDING to DELIVERED. Allowed: MEDIA_RECEIVED");
    }

    @Test
    void changingToTheCurrentStatusIsRejected() {
        assertThatThrownBy(() -> workflow.transition(videoAt(EDITING), EDITING))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Video is already EDITING");
    }

    @Test
    void undoingMediaReceivedClearsItsTimestamp() {
        Video video = videoAt(MEDIA_RECEIVED);

        workflow.transition(video, PENDING);

        assertThat(video.getStatus()).isEqualTo(PENDING);
        assertThat(video.getMediaReceivedAt()).isNull();
    }

    @Test
    void sendingBackForChangesKeepsMediaReceivedAt() {
        Video video = videoAt(REVIEW);
        Instant received = video.getMediaReceivedAt();

        workflow.transition(video, EDITING);

        assertThat(video.getMediaReceivedAt()).isEqualTo(received);
        assertThat(video.getEditCompletedAt()).isNull();
    }

    @Test
    void reopeningACompletedVideoClearsCompletion() {
        Video video = videoAt(COMPLETED);

        workflow.transition(video, REVIEW);

        assertThat(video.getEditCompletedAt()).isNull();
        assertThat(video.getMediaReceivedAt()).isNotNull();
    }

    @Test
    void reopeningADeliveredVideoClearsCompletionAndDelivery() {
        Video video = videoAt(DELIVERED);
        Instant received = video.getMediaReceivedAt();

        workflow.transition(video, EDITING);

        assertThat(video.getStatus()).isEqualTo(EDITING);
        assertThat(video.getDeliveredAt()).isNull();
        assertThat(video.getEditCompletedAt()).isNull();
        assertThat(video.getMediaReceivedAt()).isEqualTo(received);
    }

    @Test
    void redoingAStageStampsAFreshTimestamp() {
        Video video = videoAt(COMPLETED);
        Instant firstCompletion = video.getEditCompletedAt();
        workflow.transition(video, REVIEW);

        Instant secondCompletion = clock.tick();
        workflow.transition(video, COMPLETED);

        assertThat(video.getEditCompletedAt()).isEqualTo(secondCompletion).isAfter(firstCompletion);
    }

    @Test
    void allowedTransitionsListForwardFirstThenCorrection() {
        assertThat(VideoWorkflow.allowedTransitions(PENDING)).containsExactly(MEDIA_RECEIVED);
        assertThat(VideoWorkflow.allowedTransitions(REVIEW)).containsExactly(COMPLETED, EDITING);
        assertThat(VideoWorkflow.allowedTransitions(DELIVERED)).containsExactly(EDITING);
    }

    /** Walks a new video forward through the real workflow to the requested status. */
    private Video videoAt(VideoStatus target) {
        Video video = new Video(null, "Test video", ContentType.REEL);
        for (VideoStatus status : List.of(MEDIA_RECEIVED, EDITING, REVIEW, COMPLETED, DELIVERED)) {
            if (video.getStatus() == target) {
                break;
            }
            clock.tick();
            workflow.transition(video, status);
        }
        return video;
    }

    /** A clock that only moves when told to, so timestamps are deterministic. */
    private static final class TickingClock extends Clock {

        private Instant now;

        TickingClock(Instant start) {
            this.now = start;
        }

        Instant tick() {
            now = now.plus(Duration.ofMinutes(1));
            return now;
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
