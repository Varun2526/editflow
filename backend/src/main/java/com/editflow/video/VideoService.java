package com.editflow.video;

import com.editflow.common.exception.ConflictException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.common.util.Strings;
import com.editflow.project.Project;
import com.editflow.project.ProjectRepository;
import com.editflow.revision.RevisionCounts;
import com.editflow.revision.RevisionRepository;
import com.editflow.revision.dto.RevisionResponse;
import com.editflow.video.dto.VideoDetailResponse;
import com.editflow.video.dto.VideoListItem;
import com.editflow.video.dto.VideoRequest;
import com.editflow.video.dto.VideoResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoService {

    private final VideoRepository videoRepository;
    private final ProjectRepository projectRepository;
    private final RevisionRepository revisionRepository;
    private final VideoWorkflow workflow;
    private final Clock clock;

    public VideoService(VideoRepository videoRepository, ProjectRepository projectRepository,
                        RevisionRepository revisionRepository, VideoWorkflow workflow, Clock clock) {
        this.videoRepository = videoRepository;
        this.projectRepository = projectRepository;
        this.revisionRepository = revisionRepository;
        this.workflow = workflow;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<VideoResponse> listForProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw NotFoundException.of("Project", projectId);
        }
        List<Video> videos = videoRepository.findByProjectIdOrdered(projectId);
        Map<Long, RevisionCounts> counts = RevisionCounts.byVideo(
                revisionRepository, videos.stream().map(Video::getId).toList());
        LocalDate today = LocalDate.now(clock);
        return videos.stream()
                .map(v -> VideoResponse.from(v, counts.getOrDefault(v.getId(), RevisionCounts.NONE), today))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VideoListItem> listAll(VideoStatus status) {
        List<Video> videos = videoRepository.findAllInOpenProjects(status);
        Map<Long, RevisionCounts> counts = RevisionCounts.byVideo(
                revisionRepository, videos.stream().map(Video::getId).toList());
        LocalDate today = LocalDate.now(clock);
        return videos.stream()
                .map(v -> VideoListItem.from(v, counts.getOrDefault(v.getId(), RevisionCounts.NONE), today))
                .toList();
    }

    @Transactional(readOnly = true)
    public VideoDetailResponse get(Long id) {
        Video video = requireVideoWithProject(id);
        List<RevisionResponse> revisions = revisionRepository.findByVideoIdOrdered(id).stream()
                .map(RevisionResponse::from)
                .toList();
        Project project = video.getProject();
        return new VideoDetailResponse(toResponse(video), project.getName(), project.getClient().getId(),
                project.getClient().getName(), revisions);
    }

    @Transactional
    public VideoResponse create(Long projectId, VideoRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> NotFoundException.of("Project", projectId));
        Video video = new Video(project, request.title().trim(), request.contentType());
        applyDetails(video, request);
        return toResponse(videoRepository.save(video));
    }

    @Transactional
    public VideoResponse update(Long id, VideoRequest request) {
        Video video = requireVideo(id);
        video.setTitle(request.title().trim());
        video.setContentType(request.contentType());
        applyDetails(video, request);
        return toResponse(video);
    }

    @Transactional
    public VideoResponse changeStatus(Long id, VideoStatus target) {
        Video video = requireVideo(id);
        workflow.transition(video, target);
        return toResponse(video);
    }

    /** Delivered videos are part of the client's record and can't be deleted. Revisions cascade in the DB. */
    @Transactional
    public void delete(Long id) {
        Video video = requireVideo(id);
        if (video.getStatus() == VideoStatus.DELIVERED) {
            throw new ConflictException("Delivered videos cannot be deleted");
        }
        videoRepository.delete(video);
    }

    private VideoResponse toResponse(Video video) {
        Map<Long, RevisionCounts> counts = RevisionCounts.byVideo(revisionRepository, List.of(video.getId()));
        return VideoResponse.from(video, counts.getOrDefault(video.getId(), RevisionCounts.NONE), LocalDate.now(clock));
    }

    private static void applyDetails(Video video, VideoRequest request) {
        video.setDeadline(request.deadline());
        video.setDriveUrl(Strings.trimToNull(request.driveUrl()));
    }

    private Video requireVideo(Long id) {
        return videoRepository.findById(id).orElseThrow(() -> NotFoundException.of("Video", id));
    }

    private Video requireVideoWithProject(Long id) {
        return videoRepository.findWithProjectAndClientById(id).orElseThrow(() -> NotFoundException.of("Video", id));
    }
}
