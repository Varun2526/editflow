package com.editflow.user.dto;

/** Returned exactly once, to the admin, when portal access is created or reset. Never stored in plain text. */
public record PortalCredentials(String email, String temporaryPassword) {
}
