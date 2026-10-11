package com.editflow.client.dto;

import com.editflow.project.dto.ProjectResponse;

/** Row in the admin client list; "Videos", "Monthly Fee" and "Payment Status" come from the current project. */
public record ClientListItem(
        Long id,
        String name,
        String email,
        String phone,
        String companyName,
        boolean hasPortalAccess,
        ProjectResponse currentProject) {
}
