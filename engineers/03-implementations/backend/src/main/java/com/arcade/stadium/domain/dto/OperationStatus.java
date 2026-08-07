package com.arcade.stadium.domain.dto;

import java.time.Instant;

public record OperationStatus(
    boolean success,
    String message,
    Instant timestamp
) {
    public static OperationStatus ok(String message) {
        return new OperationStatus(true, message, Instant.now());
    }
}
