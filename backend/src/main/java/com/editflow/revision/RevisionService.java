package com.editflow.revision;

import com.editflow.common.exception.ConflictException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.revision.dto.RevisionListItem;
import com.editflow.revision.dto.RevisionRequest;
import com.editflow.revision.dto.RevisionResponse;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStatus;
import java.time.Clock;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Revision requests. Creating one never changes the video's status: the admin decides whether
 * to send the video back to editing through the workflow.
 */
@Service
public class RevisionService {

    /** A client can only comment on a cut they have been shown. */
    private static final Set<VideoStatus> CLIENT_REVIEWABLE =
            EnumSet.of(VideoStatus.REVIEW, VideoStatus.COMPLETED, VideoStatus.DELIVERED);

    private final RevisionRepository revisionRepository;
    private final VideoRepository videoRepository;
    private final Clock clock;

    public RevisionService(RevisionRepository revisionRepository, VideoRepository videoRepository, Clock clock) {
        this.revisionRepository = revisionRepository;
        this.videoRepository = videoRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<RevisionResponse> listForVideo(Long videoId) {
        if (!videoRepository.existsById(videoId)) {
            throw NotFoundException.of("Video", videoId);
        }
        return revisionRepository.findByVideoIdOrdered(videoId).stream().map(RevisionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RevisionListItem> listAll(RevisionStatus status) {
        return revisionRepository.findAllWithVideo(status).stream().map(RevisionListItem::from).toList();
    }

    /** Admin logs a revision, e.g. feedback received over WhatsApp. Allowed at any stage. */
    @Transactional
    public RevisionResponse createByAdmin(Long videoId, RevisionRequest request) {
        Video video = videoRepository.findById(videoId).orElseThrow(() -> NotFoundException.of("Video", videoId));
        return create(video, request, RequestedBy.ADMIN);
    }

    /** Client request for a video whose ownership the caller has already verified. */
    @Transactional
    public RevisionResponse createByClient(Video ownedVideo, RevisionRequest request) {
        if (!CLIENT_REVIEWABLE.contains(ownedVideo.getStatus())) {
            throw new ConflictException("Revisions can be requested once the video is ready for review");
        }
        return create(ownedVideo, request, RequestedBy.CLIENT);
    }

    @Transactional
    public RevisionResponse resolve(Long id) {
        Revision revision = revisionRepository.findById(id).orElseThrow(() -> NotFoundException.of("Revision", id));
        if (revision.getStatus() == RevisionStatus.RESOLVED) {
            throw new ConflictException("Revision is already resolved");
        }
        revision.resolve(clock.instant());
        return RevisionResponse.from(revision);
    }

    private RevisionResponse create(Video video, RevisionRequest request, RequestedBy requestedBy) {
        Revision revision = new Revision(video, request.timecode(), request.comment().trim(), requestedBy);
        return RevisionResponse.from(revisionRepository.save(revision));
    }
}
