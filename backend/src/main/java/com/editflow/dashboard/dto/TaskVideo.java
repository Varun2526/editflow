package com.editflow.dashboard.dto;

import com.editflow.video.ContentType;
import com.editflow.video.Video;
import com.editflow.video.VideoStatus;
import java.time.LocalDate;

public record TaskVideo(Long id, String title, ContentType contentType, VideoStatus status, LocalDate deadline,
                        Long projectId, String projectName, Long clientId, String clientName) {

    /** Requires project and client to be fetched. */
    public static TaskVideo from(Video video) {
        return new TaskVideo(video.getId(), video.getTitle(), video.getContentType(), video.getStatus(),
                video.getDeadline(), video.getProject().getId(), video.getProject().getName(),
                video.getProject().getClient().getId(), video.getProject().getClient().getName());
    }
}
