package com.editflow.dashboard;

import com.editflow.client.ClientRepository;
import com.editflow.dashboard.dto.DashboardSummaryResponse;
import com.editflow.dashboard.dto.DashboardTasksResponse;
import com.editflow.dashboard.dto.OpenRevisionItem;
import com.editflow.dashboard.dto.TaskVideo;
import com.editflow.inquiry.InquiryRepository;
import com.editflow.inquiry.InquiryStatus;
import com.editflow.payment.FinancialTotals;
import com.editflow.payment.PaymentService;
import com.editflow.project.ProjectRepository;
import com.editflow.project.ProjectStatus;
import com.editflow.revision.RevisionRepository;
import com.editflow.revision.RevisionStatus;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStats;
import com.editflow.video.VideoStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Every number here is computed from records at request time; nothing is cached or stored. */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final InquiryRepository inquiryRepository;
    private final VideoRepository videoRepository;
    private final RevisionRepository revisionRepository;
    private final PaymentService paymentService;
    private final Clock clock;

    public DashboardService(ClientRepository clientRepository, ProjectRepository projectRepository,
                            InquiryRepository inquiryRepository, VideoRepository videoRepository,
                            RevisionRepository revisionRepository, PaymentService paymentService, Clock clock) {
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.inquiryRepository = inquiryRepository;
        this.videoRepository = videoRepository;
        this.revisionRepository = revisionRepository;
        this.paymentService = paymentService;
        this.clock = clock;
    }

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now(clock);
        Map<VideoStatus, Long> counts = new EnumMap<>(VideoStatus.class);
        videoRepository.countByStatusForProjectStatus(ProjectStatus.ACTIVE)
                .forEach(row -> counts.put(row.getStatus(), row.getCount()));
        VideoStats videos = VideoStats.from(counts,
                videoRepository.countOverdueForProjectStatus(ProjectStatus.ACTIVE, today));
        FinancialTotals totals = paymentService.billableTotals();

        return new DashboardSummaryResponse(
                clientRepository.count(),
                projectRepository.countByStatus(ProjectStatus.ACTIVE),
                inquiryRepository.countByStatus(InquiryStatus.PENDING),
                revisionRepository.countByStatus(RevisionStatus.OPEN),
                videos,
                totals.totalFees(),
                totals.totalPaid(),
                totals.outstanding());
    }

    public DashboardTasksResponse tasks() {
        LocalDate today = LocalDate.now(clock);
        return new DashboardTasksResponse(
                today,
                toTasks(videoRepository.findDueOn(today)),
                toTasks(videoRepository.findOverdue(today)),
                toTasks(videoRepository.findInActiveProjectsByStatus(VideoStatus.EDITING)),
                toTasks(videoRepository.findInActiveProjectsByStatus(VideoStatus.REVIEW)),
                revisionRepository.findOpenWithVideo().stream().map(OpenRevisionItem::from).toList());
    }

    private static List<TaskVideo> toTasks(List<Video> videos) {
        return videos.stream().map(TaskVideo::from).toList();
    }
}
