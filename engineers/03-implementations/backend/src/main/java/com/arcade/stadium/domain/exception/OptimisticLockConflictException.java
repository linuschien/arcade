package com.arcade.stadium.domain.exception;

public class OptimisticLockConflictException extends RuntimeException {
    private final int currentVersion;

    public OptimisticLockConflictException(String message, int currentVersion) {
        super(message);
        this.currentVersion = currentVersion;
    }

    public int getCurrentVersion() {
        return currentVersion;
    }
}
