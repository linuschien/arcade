package com.arcade.stadium.domain.dto;

import java.time.Instant;
import java.util.UUID;

public record PlayerResponse(
    UUID id,
    String gcpIapEmail,
    boolean isAdmin,
    Instant createdAt,
    UserWalletResponse wallet
) {
    public PlayerResponse withWallet(UserWalletResponse wallet) {
        return new PlayerResponse(id, gcpIapEmail, isAdmin, createdAt, wallet);
    }

    public PlayerResponse withAdmin(boolean isAdmin) {
        return new PlayerResponse(id, gcpIapEmail, isAdmin, createdAt, wallet);
    }
}
