package com.editflow.video.dto;

import com.editflow.revision.RevisionCounts;
import com.editflow.video.ContentType;
import com.editflow.video.Video;
import com.editflow.video.VideoDeadlines;
import com.editflow.video.VideoStatus;
import com.editflow.video.VideoWorkflow;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Admin view of a video, including the transitions the workflow currently allows. */
public record VideoResponse(
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
        List<VideoStatus> allowedTransitions,
        Instant mediaReceivedAt,
        Instant editCompletedAt,
        Instant deliveredAt,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt) {

    public static VideoResponse from(Video video, RevisionCounts revisions, LocalDate today) {
        return new VideoResponse(
                video.getId(),
                video.getProject().getId(),
                video.getTitle(),
                video.getContentType(),
                video.getStatus(),
                video.getDeadline(),
                video.getDriveUrl(),
                VideoDeadlines.isOverdue(video.getDeadline(), video.getStatus(), today),
                revisions.total(),
                revisions.open(),
                VideoWorkflow.allowedTransitions(video.getStatus()),
                video.getMediaReceivedAt(),
                video.getEditCompletedAt(),
                video.getDeliveredAt(),
                video.getApprovedAt(),
                video.getCreatedAt(),
                video.getUpdatedAt());
    }
}
