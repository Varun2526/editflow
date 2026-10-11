package com.editflow.video;

import static com.editflow.video.VideoStatus.COMPLETED;
import static com.editflow.video.VideoStatus.DELIVERED;
import static com.editflow.video.VideoStatus.EDITING;
import static com.editflow.video.VideoStatus.MEDIA_RECEIVED;
import static com.editflow.video.VideoStatus.PENDING;
import static com.editflow.video.VideoStatus.REVIEW;

import com.editflow.common.exception.ConflictException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * The one place that decides which status changes are legal.
 *
 * <pre>
 * Forward (one step):  PENDING → MEDIA_RECEIVED → EDITING → REVIEW → COMPLETED → DELIVERED
 * Backward (admin corrections):
 *   MEDIA_RECEIVED → PENDING        (marked received by mistake)
 *   EDITING        → MEDIA_RECEIVED (editing not actually started)
 *   REVIEW         → EDITING        (changes requested)
 *   COMPLETED      → REVIEW         (needs another review)
 *   DELIVERED      → EDITING        (reopened after a post-delivery revision)
 * </pre>
 */
@Component
public class VideoWorkflow {

    private static final Map<VideoStatus, VideoStatus> FORWARD = new EnumMap<>(Map.of(
            PENDING, MEDIA_RECEIVED,
            MEDIA_RECEIVED, EDITING,
            EDITING, REVIEW,
            REVIEW, COMPLETED,
            COMPLETED, DELIVERED));

    private static final Map<VideoStatus, VideoStatus> BACKWARD = new EnumMap<>(Map.of(
            MEDIA_RECEIVED, PENDING,
            EDITING, MEDIA_RECEIVED,
            REVIEW, EDITING,
            COMPLETED, REVIEW,
            DELIVERED, EDITING));

    private final Clock clock;

    public VideoWorkflow(Clock clock) {
        this.clock = clock;
    }

    /** Next legal statuses, forward move first. Sent to the UI so it never has to duplicate these rules. */
    public static List<VideoStatus> allowedTransitions(VideoStatus from) {
        List<VideoStatus> allowed = new ArrayList<>(2);
        Optional.ofNullable(FORWARD.get(from)).ifPresent(allowed::add);
        Optional.ofNullable(BACKWARD.get(from)).ifPresent(allowed::add);
        return List.copyOf(allowed);
    }

    /**
     * The client's explicit sign-off: REVIEW → COMPLETED with an approval timestamp. Not allowed
     * while the client's own change requests are still open (the editor is working on them).
     */
    public void approveByClient(Video video, long openRevisions) {
        if (video.getStatus() != REVIEW) {
            throw new ConflictException("Only a video that is ready for your review can be approved");
        }
        if (openRevisions > 0) {
            throw new ConflictException("This video has open change requests — your editor is still working on them");
        }
        video.approveAt(clock.instant());
    }

    public void transition(Video video, VideoStatus target) {
        VideoStatus current = video.getStatus();
        if (current == target) {
            throw new ConflictException("Video is already " + target);
        }
        List<VideoStatus> allowed = allowedTransitions(current);
        if (!allowed.contains(target)) {
            String options = allowed.stream().map(Enum::name).collect(Collectors.joining(", "));
            throw new ConflictException(
                    "Cannot change status from " + current + " to " + target + ". Allowed: " + options);
        }
        video.transitionTo(target, clock.instant());
    }
}
