package com.arcade.stadium.domain.dto;

import java.time.Instant;
import java.util.UUID;

public record UserWalletResponse(
    UUID id,
    UUID playerId,
    int dailyFreeCredit,
    int adminBonusCredit,
    int totalCredits,
    Instant lastDailyResetTime,
    int version
) {}
