package com.editflow.revision.dto;

import com.editflow.revision.Revision;

/** Row in the admin revision index: the revision plus its video, project and client. */
public record RevisionListItem(RevisionResponse revision, String videoTitle, Long projectId, String projectName,
                               Long clientId, String clientName) {

    /** Requires video, project and client to be fetched. */
    public static RevisionListItem from(Revision revision) {
        var video = revision.getVideo();
        var project = video.getProject();
        return new RevisionListItem(RevisionResponse.from(revision), video.getTitle(), project.getId(),
                project.getName(), project.getClient().getId(), project.getClient().getName());
    }
}
