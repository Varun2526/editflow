package com.editflow.client.dto;

import com.editflow.user.dto.PortalCredentials;

/** portalAccess is non-null only when a login was created; the temporary password is shown once. */
public record ClientCreatedResponse(ClientDetailResponse client, PortalCredentials portalAccess) {
}
