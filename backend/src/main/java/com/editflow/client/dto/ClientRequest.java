package com.editflow.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param createPortalAccess only used on create: also creates a CLIENT login with a temporary password.
 */
public record ClientRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phone,
        @Size(max = 60) String instagram,
        @Size(max = 120) String companyName,
        @Size(max = 5000) String notes,
        Boolean createPortalAccess) {
}
