package com.editflow.portal.dto;

import com.editflow.revision.RevisionCounts;
import com.editflow.video.ContentType;
import com.editflow.video.Video;
import com.editflow.video.VideoDeadlines;
import com.editflow.video.VideoStatus;
import java.time.Instant;
import java.time.LocalDate;

/** Client-facing video: read-only, no workflow controls. */
public record ClientVideoResponse(
        Long id,
        Long projectId,
        String title,
        ContentType contentType,
        VideoStatus status,
        LocalDate deadline,
        String driveUrl,
        boolean overdue,
        long revisionCount,
        long openRevisionCount,
        Instant approvedAt,
        Instant deliveredAt) {

    public static ClientVideoResponse from(Video video, RevisionCounts revisions, LocalDate today) {
        return new ClientVideoResponse(video.getId(), video.getProject().getId(), video.getTitle(),
                video.getContentType(), video.getStatus(), video.getDeadline(), video.getDriveUrl(),
                VideoDeadlines.isOverdue(video.getDeadline(), video.getStatus(), today),
                revisions.total(), revisions.open(), video.getApprovedAt(), video.getDeliveredAt());
    }
}
