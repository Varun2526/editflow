package com.editflow.video.dto;

import com.editflow.revision.RevisionCounts;
import com.editflow.video.Video;
import java.time.LocalDate;

/** Row in the admin video index: the video plus where it belongs. */
public record VideoListItem(VideoResponse video, String projectName, Long clientId, String clientName) {

    /** Requires project and client to be fetched. */
    public static VideoListItem from(Video video, RevisionCounts revisions, LocalDate today) {
        return new VideoListItem(VideoResponse.from(video, revisions, today), video.getProject().getName(),
                video.getProject().getClient().getId(), video.getProject().getClient().getName());
    }
}
