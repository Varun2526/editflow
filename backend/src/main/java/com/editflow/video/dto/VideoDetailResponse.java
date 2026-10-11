package com.editflow.video.dto;

import com.editflow.revision.dto.RevisionResponse;
import java.util.List;

public record VideoDetailResponse(
        VideoResponse video,
        String projectName,
        Long clientId,
        String clientName,
        List<RevisionResponse> revisions) {
}
