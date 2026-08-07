package com.arcade.stadium.domain.dto;

import java.time.Instant;
import java.util.UUID;

public record PlayerResponse(
    UUID id,
    String gcpIapEmail,
    Instant createdAt,
    UserWalletResponse wallet
) {
    public PlayerResponse withWallet(UserWalletResponse wallet) {
        return new PlayerResponse(id, gcpIapEmail, createdAt, wallet);
    }
}
