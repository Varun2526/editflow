package com.editflow.client.dto;

import com.editflow.project.dto.ProjectResponse;
import java.time.Instant;
import java.util.List;

/** Admin view of a client, including internal notes. Never returned by client-portal endpoints. */
public record ClientDetailResponse(
        Long id,
        String name,
        String email,
        String phone,
        String instagram,
        String companyName,
        String notes,
        boolean hasPortalAccess,
        Instant createdAt,
        ProjectResponse currentProject,
        List<ProjectResponse> projects) {
}
