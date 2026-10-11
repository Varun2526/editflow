package com.editflow.dashboard.dto;

import com.editflow.revision.RequestedBy;
import com.editflow.revision.Revision;
import java.time.Instant;

public record OpenRevisionItem(Long id, String timecode, String comment, RequestedBy requestedBy, Instant requestedAt,
                               Long videoId, String videoTitle, Long clientId, String clientName) {

    /** Requires video, project and client to be fetched. */
    public static OpenRevisionItem from(Revision revision) {
        return new OpenRevisionItem(revision.getId(), revision.getTimecode(), revision.getComment(),
                revision.getRequestedBy(), revision.getCreatedAt(), revision.getVideo().getId(),
                revision.getVideo().getTitle(), revision.getVideo().getProject().getClient().getId(),
                revision.getVideo().getProject().getClient().getName());
    }
}
