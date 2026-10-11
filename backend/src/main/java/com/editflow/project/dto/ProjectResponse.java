package com.editflow.project.dto;

import com.editflow.payment.PaymentSummary;
import com.editflow.project.Project;
import com.editflow.project.ProjectMetrics;
import com.editflow.project.ProjectStatus;
import com.editflow.video.VideoStats;
import java.math.BigDecimal;
import java.time.Instant;

/** Project with derived metrics. Contains no admin-only data, so it is shared with the client portal. */
public record ProjectResponse(
        Long id,
        Long clientId,
        String clientName,
        String name,
        String description,
        int month,
        int year,
        ProjectStatus status,
        BigDecimal totalFee,
        VideoStats videos,
        PaymentSummary payment,
        Instant createdAt,
        Instant updatedAt) {

    /** Requires the project's client to be loaded (fetch join) when called outside the client's own context. */
    public static ProjectResponse from(Project project, ProjectMetrics metrics) {
        return new ProjectResponse(
                project.getId(),
                project.getClient().getId(),
                project.getClient().getName(),
                project.getName(),
                project.getDescription(),
                project.getPeriodMonth(),
                project.getPeriodYear(),
                project.getStatus(),
                project.getTotalFee(),
                metrics.videos(),
                metrics.payment(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
