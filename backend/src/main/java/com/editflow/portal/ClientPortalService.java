package com.editflow.portal;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.common.exception.ForbiddenException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.payment.PaymentService;
import com.editflow.payment.dto.ProjectPaymentsResponse;
import com.editflow.portal.dto.ClientDashboardResponse;
import com.editflow.portal.dto.ClientProfileResponse;
import com.editflow.portal.dto.ClientVideoDetailResponse;
import com.editflow.portal.dto.ClientVideoResponse;
import com.editflow.project.CurrentProjectSelector;
import com.editflow.project.Project;
import com.editflow.project.ProjectMetrics;
import com.editflow.project.ProjectMetricsService;
import com.editflow.project.ProjectRepository;
import com.editflow.project.dto.ProjectResponse;
import com.editflow.revision.RevisionCounts;
import com.editflow.revision.RevisionRepository;
import com.editflow.revision.RevisionService;
import com.editflow.revision.dto.RevisionRequest;
import com.editflow.revision.dto.RevisionResponse;
import com.editflow.security.CurrentUser;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoWorkflow;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Client portal. The client is always resolved from the authenticated user ({@link CurrentUser#clientId()});
 * every project/video lookup is checked against it, and a resource owned by another client is a 403.
 */
@Service
@Transactional(readOnly = true)
public class ClientPortalService {

    private final CurrentUser currentUser;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final VideoRepository videoRepository;
    private final RevisionRepository revisionRepository;
    private final ProjectMetricsService metricsService;
    private final PaymentService paymentService;
    private final RevisionService revisionService;
    private final VideoWorkflow workflow;
    private final Clock clock;

    public ClientPortalService(CurrentUser currentUser, ClientRepository clientRepository,
                               ProjectRepository projectRepository, VideoRepository videoRepository,
                               RevisionRepository revisionRepository, ProjectMetricsService metricsService,
                               PaymentService paymentService, RevisionService revisionService,
                               VideoWorkflow workflow, Clock clock) {
        this.currentUser = currentUser;
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.videoRepository = videoRepository;
        this.revisionRepository = revisionRepository;
        this.metricsService = metricsService;
        this.paymentService = paymentService;
        this.revisionService = revisionService;
        this.workflow = workflow;
        this.clock = clock;
    }

    public ClientProfileResponse profile() {
        return ClientProfileResponse.from(ownClient());
    }

    public ClientDashboardResponse dashboard() {
        Client client = ownClient();
        List<Project> projects = projectRepository.findByClientIdWithClient(client.getId());
        Project current = CurrentProjectSelector.select(projects).orElse(null);
        if (current == null) {
            return new ClientDashboardResponse(client.getName(), null, List.of(), 0);
        }
        return new ClientDashboardResponse(
                client.getName(),
                ProjectResponse.from(current, metricsService.metricsFor(current)),
                toClientVideos(videoRepository.findUpcomingDeadlines(current.getId())),
                revisionRepository.countOpenByProjectId(current.getId()));
    }

    public List<ProjectResponse> projects() {
        List<Project> projects = projectRepository.findByClientIdWithClient(currentUser.clientId());
        Map<Long, ProjectMetrics> metrics = metricsService.metricsFor(projects);
        return projects.stream().map(p -> ProjectResponse.from(p, metrics.get(p.getId()))).toList();
    }

    public ProjectResponse project(Long projectId) {
        Project project = ownedProject(projectId);
        return ProjectResponse.from(project, metricsService.metricsFor(project));
    }

    public List<ClientVideoResponse> projectVideos(Long projectId) {
        Project project = ownedProject(projectId);
        return toClientVideos(videoRepository.findByProjectIdOrdered(project.getId()));
    }

    public ProjectPaymentsResponse projectPayments(Long projectId) {
        return paymentService.paymentsOf(ownedProject(projectId));
    }

    public ClientVideoDetailResponse video(Long videoId) {
        Video video = ownedVideo(videoId);
        List<RevisionResponse> revisions = revisionRepository.findByVideoIdOrdered(videoId).stream()
                .map(RevisionResponse::from)
                .toList();
        return new ClientVideoDetailResponse(toClientVideos(List.of(video)).getFirst(),
                video.getProject().getName(), revisions);
    }

    @Transactional
    public RevisionResponse requestRevision(Long videoId, RevisionRequest request) {
        return revisionService.createByClient(ownedVideo(videoId), request);
    }

    /** The client signs off a video in REVIEW (ownership checked; the workflow enforces the rules). */
    @Transactional
    public ClientVideoResponse approveVideo(Long videoId) {
        Video video = ownedVideo(videoId);
        long open = RevisionCounts.byVideo(revisionRepository, List.of(videoId))
                .getOrDefault(videoId, RevisionCounts.NONE).open();
        workflow.approveByClient(video, open);
        return toClientVideos(List.of(video)).getFirst();
    }

    private Client ownClient() {
        Long clientId = currentUser.clientId();
        return clientRepository.findById(clientId).orElseThrow(() -> NotFoundException.of("Client", clientId));
    }

    private Project ownedProject(Long projectId) {
        Project project = projectRepository.findWithClientById(projectId)
                .orElseThrow(() -> NotFoundException.of("Project", projectId));
        if (!project.getClient().getId().equals(currentUser.clientId())) {
            throw new ForbiddenException("You do not have access to this project");
        }
        return project;
    }

    private Video ownedVideo(Long videoId) {
        Video video = videoRepository.findWithProjectAndClientById(videoId)
                .orElseThrow(() -> NotFoundException.of("Video", videoId));
        if (!video.getProject().getClient().getId().equals(currentUser.clientId())) {
            throw new ForbiddenException("You do not have access to this video");
        }
        return video;
    }

    private List<ClientVideoResponse> toClientVideos(List<Video> videos) {
        Map<Long, RevisionCounts> counts = RevisionCounts.byVideo(
                revisionRepository, videos.stream().map(Video::getId).toList());
        LocalDate today = LocalDate.now(clock);
        return videos.stream()
                .map(v -> ClientVideoResponse.from(v, counts.getOrDefault(v.getId(), RevisionCounts.NONE), today))
                .toList();
    }
}
