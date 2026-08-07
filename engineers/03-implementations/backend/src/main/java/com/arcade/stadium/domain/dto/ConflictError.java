package com.arcade.stadium.domain.dto;

import java.time.Instant;

public record ConflictError(
    String code,
    String message,
    int currentVersion,
    Instant timestamp
) {
    public static ConflictError of(String message, int currentVersion) {
        return new ConflictError("OPTIMISTIC_LOCK_CONFLICT", message, currentVersion, Instant.now());
    }
}
