package com.arcade.stadium.infrastructure.security;

public record UserAuthentication(
        String email,
        boolean isAdmin,
        boolean isGuest
) {
    public UserAuthentication(String email, boolean isAdmin) {
        this(email, isAdmin, false);
    }
}
