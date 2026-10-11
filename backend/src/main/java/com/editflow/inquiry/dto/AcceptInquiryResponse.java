package com.editflow.inquiry.dto;

import com.editflow.user.dto.PortalCredentials;

/**
 * @param clientCreated false when an existing client (same email) was reused
 * @param portalAccess  temporary login, shown once; null when the client already had portal access
 */
public record AcceptInquiryResponse(
        InquiryResponse inquiry,
        Long clientId,
        Long projectId,
        boolean clientCreated,
        PortalCredentials portalAccess) {
}
