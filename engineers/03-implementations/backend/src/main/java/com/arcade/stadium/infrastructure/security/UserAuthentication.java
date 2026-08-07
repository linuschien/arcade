package com.arcade.stadium.infrastructure.security;

public record UserAuthentication(
        String email,
        boolean isAdmin
) {
    public static final UserAuthentication ANONYMOUS = new UserAuthentication("anonymous", false);
}
