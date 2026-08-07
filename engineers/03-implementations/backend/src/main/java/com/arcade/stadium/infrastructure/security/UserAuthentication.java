package com.arcade.stadium.infrastructure.security;

public record UserAuthentication(
        String email,
        boolean isAdmin
) {}
