package com.editflow.portal.dto;

import com.editflow.project.dto.ProjectResponse;
import java.util.List;

/**
 * @param currentProject latest ACTIVE project (else latest project); null if the client has none
 * @param upcomingDeadlines next undelivered videos of the current project, soonest first (max 5)
 */
public record ClientDashboardResponse(
        String clientName,
        ProjectResponse currentProject,
        List<ClientVideoResponse> upcomingDeadlines,
        long openRevisions) {
}
