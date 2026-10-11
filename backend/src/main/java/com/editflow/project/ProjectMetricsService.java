package com.editflow.project;

import com.editflow.payment.PaymentRepository;
import com.editflow.payment.PaymentSummary;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStats;
import com.editflow.video.VideoStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The single place that derives project metrics (video counts, progress, payments) from records.
 * Batched: a constant number of aggregate queries regardless of how many projects are requested.
 */
@Service
@Transactional(readOnly = true)
public class ProjectMetricsService {

    private final VideoRepository videoRepository;
    private final PaymentRepository paymentRepository;
    private final Clock clock;

    public ProjectMetricsService(VideoRepository videoRepository, PaymentRepository paymentRepository, Clock clock) {
        this.videoRepository = videoRepository;
        this.paymentRepository = paymentRepository;
        this.clock = clock;
    }

    public ProjectMetrics metricsFor(Project project) {
        return metricsFor(List.of(project)).get(project.getId());
    }

    public Map<Long, ProjectMetrics> metricsFor(Collection<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = projects.stream().map(Project::getId).toList();
        LocalDate today = LocalDate.now(clock);

        Map<Long, Map<VideoStatus, Long>> counts = new HashMap<>();
        for (VideoRepository.ProjectStatusCount row : videoRepository.countByProjectAndStatus(ids)) {
            counts.computeIfAbsent(row.getProjectId(), id -> new EnumMap<>(VideoStatus.class))
                    .put(row.getStatus(), row.getCount());
        }
        Map<Long, Long> overdue = new HashMap<>();
        for (VideoRepository.ProjectCount row : videoRepository.countOverdueByProject(ids, today)) {
            overdue.put(row.getProjectId(), row.getCount());
        }
        Map<Long, BigDecimal> paid = new HashMap<>();
        for (PaymentRepository.ProjectTotal row : paymentRepository.sumByProjectIds(ids)) {
            paid.put(row.getProjectId(), row.getTotal());
        }

        Map<Long, ProjectMetrics> result = new HashMap<>();
        for (Project project : projects) {
            Long id = project.getId();
            VideoStats videos = VideoStats.from(counts.getOrDefault(id, Map.of()), overdue.getOrDefault(id, 0L));
            PaymentSummary payment = PaymentSummary.of(project.getTotalFee(), paid.getOrDefault(id, BigDecimal.ZERO));
            result.put(id, new ProjectMetrics(videos, payment));
        }
        return result;
    }
}
