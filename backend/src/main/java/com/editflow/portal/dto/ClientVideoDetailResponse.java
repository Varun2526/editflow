package com.editflow.portal.dto;

import com.editflow.revision.dto.RevisionResponse;
import java.util.List;

public record ClientVideoDetailResponse(ClientVideoResponse video, String projectName,
                                        List<RevisionResponse> revisions) {
}
