package com.editflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 72 is BCrypt's input limit; longer passwords would be silently truncated. */
public record ChangePasswordRequest(
        @NotBlank @Size(max = 72) String currentPassword,
        @NotBlank @Size(min = 8, max = 72, message = "must be between 8 and 72 characters") String newPassword) {
}
