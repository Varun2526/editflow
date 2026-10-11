package com.editflow.security;

public final class SecurityAuthorities {

    /** Granted while the account still has a temporary password; blocks everything except /api/auth/**. */
    public static final String PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

    private SecurityAuthorities() {
    }
}
