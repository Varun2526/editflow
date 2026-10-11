package com.editflow.revision.dto;

import com.editflow.revision.RequestedBy;
import com.editflow.revision.Revision;
import com.editflow.revision.RevisionStatus;
import java.time.Instant;

public record RevisionResponse(
        Long id,
        Long videoId,
        String timecode,
        String comment,
        RevisionStatus status,
        RequestedBy requestedBy,
        Instant requestedAt,
        Instant resolvedAt) {

    public static RevisionResponse from(Revision revision) {
        return new RevisionResponse(revision.getId(), revision.getVideo().getId(), revision.getTimecode(),
                revision.getComment(), revision.getStatus(), revision.getRequestedBy(), revision.getCreatedAt(),
                revision.getResolvedAt());
    }
}
