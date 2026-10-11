package com.editflow.auth.dto;

import com.editflow.user.Role;
import com.editflow.user.User;

public record UserResponse(Long id, String name, String email, Role role, boolean mustChangePassword) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isMustChangePassword());
    }
}
